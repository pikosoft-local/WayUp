import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { z } from 'zod';

export interface FollowUpQuestion {
  id: string;
  type: 'text' | 'choice' | 'multi' | 'slider';
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
    type: z.literal('text'),
  }),
  z.object({
    text: z.string().trim().min(5).max(250),
    type: z.enum(['choice', 'multi']),
    options: z.array(z.string().trim().min(1).max(80)).min(2).max(5),
  }),
  z.object({
    text: z.string().trim().min(5).max(250),
    type: z.literal('slider'),
    min: z.number().optional().default(0),
    max: z.number().optional().default(100),
    minLabel: z.string().trim().optional(),
    maxLabel: z.string().trim().optional(),
  }),
]);

const FOLLOW_UP_PROMPT = `Prowadzisz dynamiczny quiz zawodowy. Na podstawie profilu użytkownika oraz WYMAGANEGO TYPU w treści zadania, wygeneruj JEDNO pogłębiające pytanie w formacie JSON.

ZASADY STRUKTURALNE:
- Zwróć WYŁĄCZNIE poprawny JSON, idealnie domknięty ({}, []). Żadnego tekstu poza JSON-em.
- Pole "type" w zwracanym JSON-ie musi dokładnie odpowiadać typowi wymaganemu w zadaniu.
- **Dla slidera:** Suwak to spektrum preferencji lub stopień nastawienia (np. od "Nie przepadam / Unikam" do "Uwielbiam / Zdecydowanie tak" albo dylemat typu "X vs Y"). Tekst pytania NIGDY nie może zawierać zwrotów typu "skala od 0 do 100". Zawsze podawaj "min": 0, "max": 100 oraz "minLabel" i "maxLabel".
- Definicje struktur:
  1. Dla "text": {"text": "...", "type": "text"}
  2. Dla "choice": {"text": "...", "type": "choice", "options": ["Opcja 1", "Opcja 2", "Opcja 3"]}
  3. Dla "multi": {"text": "...", "type": "multi", "options": ["Opcja 1", "Opcja 2", "Opcja 3", "Opcja 4"]}
  4. Dla "slider": {"text": "Jak bardzo lubisz X?", "type": "slider", "min": 0, "max": 100, "minLabel": "Nie przepadam", "maxLabel": "Uwielbiam"}`;

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);
  private groq: Groq;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    this.groq = new Groq({ apiKey });
  }

  async generateFollowUp(submission: any, alreadyAsked: string[] = []): Promise<FollowUpQuestion | null> {
    const allowedTypes = ['text', 'choice', 'multi', 'slider'] as const;
    const forcedType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];

    const userPrompt =
      `Profil i dotychczasowe odpowiedzi użytkownika:\n${JSON.stringify(submission, null, 2)}\n\n` +
      `Tematy, o które już pytano: ${alreadyAsked.join(', ')}\n\n` +
      `WYMAGANY TYP PYTANIA: Musisz wygenerować pytanie o typie EXACTLY: "${forcedType}". ` +
      `Dostosuj jego język, kontekst i stopień skomplikowania do profilu użytkownika.`;

    const modelName = this.configService.get<string>('GROQ_MODEL') || 'openai/gpt-oss-20b';

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const completion = await this.groq.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: FOLLOW_UP_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content;
        if (!raw) continue;

        const parsed = followUpSchema.safeParse(this.extractJson(raw));
        if (parsed.success) {
          const data = parsed.data;
          
          let formattedOptions: { id: string; label: string }[] | undefined = undefined;
          if (('options' in data) && Array.isArray(data.options)) {
            formattedOptions = data.options.map((label, i) => ({ id: `o${i + 1}`, label }));
          }

          const minVal = ('min' in data && typeof data.min === 'number') ? data.min : 0;
          const maxVal = ('max' in data && typeof data.max === 'number') ? data.max : 100;
          const minLabelVal = ('minLabel' in data && typeof data.minLabel === 'string') ? data.minLabel : undefined;
          const maxLabelVal = ('maxLabel' in data && typeof data.maxLabel === 'string') ? data.maxLabel : undefined;

          return {
            id: `f${alreadyAsked.length + 1}`,
            type: data.type,
            text: data.text,
            ...(formattedOptions ? { options: formattedOptions } : {}),
            ...(data.type === 'slider' ? { 
                min: minVal, 
                max: maxVal,
                ...(minLabelVal ? { minLabel: minLabelVal } : {}),
                ...(maxLabelVal ? { maxLabel: maxLabelVal } : {})
            } : {}),
          };
        }

        this.logger.warn(`Pytanie uzupełniające niezgodne ze schematem (próba ${attempt})`);
      } catch (err: any) {
        this.logger.warn(`Błąd podczas generowania follow-up (próba ${attempt}): ${err?.message || err}`);
      }
    }

    return null;
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