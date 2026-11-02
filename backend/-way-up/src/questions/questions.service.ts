import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Groq from "groq-sdk";
import { z } from "zod";
import { Question } from "./questions.types";
import { QUESTION_BANK, QUESTIONS_BY_ID } from "./questions.data";

export interface FollowUpQuestion {
  id: string;
  type: "text" | "choice" | "multi" | "slider";
  text: string;
  options?: { id: string; label: string }[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}

const followUpSchema = z.union([
  z.object({
    text: z.string().trim().min(5).max(250),
    type: z.literal("text"),
  }),
  z.object({
    text: z.string().trim().min(5).max(250),
    type: z.enum(["choice", "multi"]),
    options: z.array(z.string().trim().min(1).max(80)).min(2).max(5),
  }),
  z.object({
    text: z.string().trim().min(5).max(250),
    type: z.literal("slider"),
    min: z.number().optional().default(0),
    max: z.number().optional().default(100),
    minLabel: z.string().trim().optional(),
    maxLabel: z.string().trim().optional(),
  }),
]);

const QUESTION_THEMES = [
  "sport i ruch", "muzyka i sztuka", "pomaganie ludziom", "natura i zwierzęta", "zdrowie i ciało",
  "biznes i pieniądze", "nauka i eksperymenty", "podróże i języki", "jedzenie i gotowanie",
  "moda i wygląd", "budowanie i naprawianie", "media i opowiadanie historii", "prawo i sprawiedliwość",
  "nauczanie i tłumaczenie", "organizowanie wydarzeń", "ekologia i środowisko",
];

function pickRandom<T>(items: T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

const FOLLOW_UP_PROMPT = `Prowadzisz dynamiczny quiz zawodowy. Na podstawie profilu użytkownika oraz WYMAGANEGO TYPU w treści zadania, wygeneruj JEDNO pogłębiające pytanie w formacie JSON.

ZASADY STRUKTURALNE:
- Zwróć WYŁĄCZNIE poprawny JSON, idealnie domknięty ({}, []). Żadnego tekstu poza JSON-em.
- Pole "type" w zwracanym JSON-ie musi dokładnie odpowiadać typowi wymaganemu w zadaniu.
- **Dla slidera:** Suwak to spektrum preferencji lub stopień nastawienia (np. od "Nie przepadam / Unikam" do "Uwielbiam / Zdecydowanie tak" albo dylemat typu "X vs Y"). Tekst pytania NIGDY nie może zawierać zwrotów typu "skala od 0 do 100". Zawsze podawaj "min": 0, "max": 100 oraz "minLabel" i "maxLabel".
- Definicje struktur:
  1. Dla "text": {"text": "...", "type": "text"}
  2. Dla "choice": {"text": "...", "type": "choice", "options": ["Opcja 1", "Opcja 2", "Opcja 3"]}
  3. Dla "multi": {"text": "...", "type": "multi", "options": ["Opcja 1", "Opcja 2", "Opcja 3", "Opcja 4"]}
  4. Dla "slider": {"text": "Jak bardzo lubisz X?", "type": "slider", "min": 0, "max": 100, "minLabel": "Nie przepadam", "maxLabel": "Uwielbiam"}

ZASADY TREŚCIOWE:
- Wszystkie teksty (text, options, minLabel, maxLabel) muszą być po polsku.
- Pytanie musi wynikać z konkretnych odpowiedzi użytkownika i pogłębiać NOWY, jeszcze nieporuszony aspekt jego profilu.
- Nie powtarzaj tematów ani pytań z listy "Tematy, o które już pytano" ani z odpowiedzi już udzielonych.
- Nie narzucaj predyspozycji informatycznych/technologicznych, jeśli odpowiedzi na to nie wskazują. Dostosuj pytanie do realnych zainteresowań użytkownika.
- Nie używaj angielskich słów, jeśli nie są konieczne.`;

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);
  private groq: Groq;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GROQ_API_KEY");
    this.groq = new Groq({ apiKey });
  }

  async generateFollowUp(submission: any, alreadyAsked: string[] = []): Promise<FollowUpQuestion | null> {
    const allowedTypes = ["text", "choice", "multi", "slider"] as const;
    const forcedType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];

    const followUps = Array.isArray(submission?.followUps) ? submission.followUps : [];
    const derivedAsked = followUps
      .map((item: any) => (typeof item?.question === "string" ? item.question.trim() : ""))
      .filter((q: string) => q.length > 0);
    const askedTopics = (alreadyAsked.length > 0 ? alreadyAsked : derivedAsked)
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0);

    const askedQuestionsText = followUps.length
      ? followUps
          .map((item: any) => `- ${item?.question ?? ""}: ${Array.isArray(item?.answer) ? item.answer.join(", ") : (item?.answer ?? "")}`)
          .join("\n")
      : "brak";

    const userPrompt =
      `Profil i dotychczasowe odpowiedzi użytkownika:\n${JSON.stringify(submission, null, 2)}\n\n` +
      `Już zadane pytania dodatkowe i odpowiedzi na nie:\n${askedQuestionsText}\n\n` +
      `Tematy/pytania, o które już pytano (NIE POWTARZAJ): ${askedTopics.join(", ") || "brak"}\n\n` +
      `WYMAGANY TYP PYTANIA: Musisz wygenerować pytanie o typie EXACTLY: "${forcedType}". ` +
      `Dostosuj jego język, kontekst i stopień skomplikowania do profilu użytkownika. ` +
      `Wygeneruj NOWE pytanie zależne od poprzednich odpowiedzi, niepodobne do już zadanych. Wszystkie teksty po polsku. Dla różnorodności możesz nawiązać do obszaru: ${pickRandom(QUESTION_THEMES, 1)[0]}, o ile pasuje do odpowiedzi użytkownika.`;

    const modelName = this.configService.get<string>("GROQ_MODEL") || "openai/gpt-oss-20b";

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const completion = await this.groq.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: FOLLOW_UP_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        });

        const raw = completion.choices[0]?.message?.content;
        if (!raw) continue;

        const parsed = followUpSchema.safeParse(this.extractJson(raw));
        if (parsed.success) {
          const data = parsed.data;

          let formattedOptions: { id: string; label: string }[] | undefined = undefined;
          if (("options" in data) && Array.isArray(data.options)) {
            formattedOptions = data.options.map((label, i) => ({ id: `o${i + 1}`, label }));
          }

          const minVal = ("min" in data && typeof data.min === "number") ? data.min : 0;
          const maxVal = ("max" in data && typeof data.max === "number") ? data.max : 100;
          const minLabelVal = ("minLabel" in data && typeof data.minLabel === "string") ? data.minLabel : undefined;
          const maxLabelVal = ("maxLabel" in data && typeof data.maxLabel === "string") ? data.maxLabel : undefined;

          return {
            id: `f${followUps.length + 1}`,
            type: data.type,
            text: data.text,
            ...(formattedOptions ? { options: formattedOptions } : {}),
            ...(data.type === "slider"
              ? {
                  min: minVal,
                  max: maxVal,
                  ...(minLabelVal ? { minLabel: minLabelVal } : {}),
                  ...(maxLabelVal ? { maxLabel: maxLabelVal } : {}),
                }
              : {}),
          };
        }

        this.logger.warn(`Pytanie uzupełniające niezgodne ze schematem (próba ${attempt})`);
      } catch (err: any) {
        this.logger.warn(`Błąd podczas generowania follow-up (próba ${attempt}): ${err?.message || err}`);
      }
    }

    return null;
  }

  async generateDynamicQuestions(): Promise<Question[]> {
    const baseQuestions = QUESTION_BANK.filter((q) => q.block === 1);

    const systemPrompt = `Jesteś generatorem pytań do quizu zawodowego dla nastolatków. Wygeneruj 15 NOWYCH pytań (id od "5" do "19") uzupełniających 5 pytań bazowych. Zwróć WYŁĄCZNIE JSON: {"questions":[{"id":"5","type":"text|choice|multi|slider","label":"krótka etykieta","text":"treść pytania","options":["opcja1","opcja2"],"minLabel":"...","maxLabel":"..."}]}.
ZAŁOŻENIA:
- Struktura: id 5-9 to blok "Twoja energia" (co daje energię, co robi w wolnym czasie, jak pracuje i się uczy, jak się nudzi i działa), id 10-14 to blok "Szkoła i styl pracy" (przedmioty, współpraca vs rywalizacja, środowisko i miejsce pracy, czego chce się nauczyć), id 15-19 to blok "Pasje i plany" (zawody, które ciekawią, pomysły, zainteresowania, marzenia).
- Typy wymieszaj: w całym zestawie co najmniej 3 pytania slider, 3 choice, 2 multi, a reszta text.
- Dla choice/multi podaj 2-5 opcji, dla slider podaj minLabel i maxLabel (spektrum preferencji, bez "skala od 0 do 100").
- Wszystkie teksty po polsku, luźno, zrozumiale dla nastolatka.
- Nie narzucaj predyspozycji informatycznych/technologicznych; pytania mają być uniwersalne i dotyczyć różnych dziedzin życia i pracy. Nie wspominaj o programowaniu, SQL ani C++.
- Pytania mają być za każdym razem inne, kreatywne i się nie powtarzać. Nie powtarzaj pytań bazowych.`;
    const userPrompt = `Pytania bazowe:\n${JSON.stringify(baseQuestions.map((q) => ({ id: q.id, text: q.text, type: q.type })), null, 2)}\n\nWygeneruj pytania o id od 5 do 19. Uwzględnij m.in. motywy: ${pickRandom(QUESTION_THEMES, 6).join(", ")}. Wszystkie teksty po polsku. Kod losowy: ${Math.random().toString(36).slice(2, 8)}.`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const params = {
          model: this.configService.get<string>("GROQ_MODEL") || "openai/gpt-oss-20b",
          messages: [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: userPrompt },
          ],
          temperature: 0.95,
          max_completion_tokens: 6000,
          reasoning_effort: "low" as const,
          response_format: { type: "json_object" as const },
        };
        const completion = await this.groq.chat.completions.create(params);

        const raw = completion.choices[0]?.message?.content;
        const parsed = raw ? this.extractJson(raw) : undefined;
        const list = Array.isArray((parsed as any)?.questions) ? (parsed as any).questions : [];

        const result: Question[] = [];
        for (let i = 5; i <= 19; i++) {
          const id = String(i);
          const item = list.find((q: any) => String(q?.id) === id) || list[i - 5];
          if (!item || typeof item.text !== "string" || item.text.trim().length < 5) break;

          const type = ["text", "choice", "multi", "slider"].includes(item.type) ? item.type : "text";
          let options: { id: string; label: string }[] | undefined = undefined;
          if (type === "choice" || type === "multi") {
            options = (Array.isArray(item.options) ? item.options : [])
              .filter((o: any) => typeof o === "string" && o.trim().length > 0)
              .slice(0, 5)
              .map((label: string, idx: number) => ({ id: `o${idx + 1}`, label: label.trim() }));
            if (!options || options.length < 2) break;
          }

          result.push({
            id,
            block: i < 10 ? 2 : i < 15 ? 3 : 4,
            type: type as Question["type"],
            label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : item.text.trim().slice(0, 60),
            text: item.text.trim(),
            ...(options ? { options } : {}),
            ...(type === "slider"
              ? {
                  minLabel: typeof item.minLabel === "string" && item.minLabel.trim() ? item.minLabel.trim() : "Nie przepadam",
                  maxLabel: typeof item.maxLabel === "string" && item.maxLabel.trim() ? item.maxLabel.trim() : "Uwielbiam",
                }
              : {}),
          });
        }

        if (result.length === 15) {
          for (const q of result) QUESTIONS_BY_ID.set(q.id, q);
          return result;
        }
        this.logger.warn(`Wygenerowano niepełny zestaw pytań (próba ${attempt}): ${result.length}/15`);
      } catch (err: any) {
        this.logger.warn(`Błąd generowania pytań dynamicznych (próba ${attempt}): ${err?.message || err}`);
      }
    }

    throw new ServiceUnavailableException({
      ok: false,
      error: "Nie udało się wygenerować pytań quizu. Spróbuj ponownie za chwilę.",
    });
  }
  private extractJson(content: string): any {
    try {
      return JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return {};
        }
      }
      return {};
    }
  }
}