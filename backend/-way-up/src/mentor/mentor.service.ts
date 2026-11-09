import { Injectable, Logger } from '@nestjs/common';
import { ChatMessage, GroqService } from '../ai/groq.service';
import { badRequest, notFound, tooManyRequests } from '../common/errors';
import { PathType } from '../profile/profile.schema';
import { formatStoredAnswers, looksEnglish, stripMarkdown } from './mentor.format';
import { mentorSystemPrompt } from './mentor.prompts';
import { MentorRepository } from './mentor.repository';
import { ResultsRepository } from '../results/results.repository';

export const MAX_USER_MESSAGES_PER_RESULT = 50;
const HISTORY_WINDOW = 12;
const CHAT_OPTIONS = { temperature: 0.8, maxTokens: 1500 } as const;

export type MentorStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; reply: string; pathType: PathType; saved: boolean };

@Injectable()
export class MentorService {
  private readonly logger = new Logger(MentorService.name);

  constructor(
    private readonly groq: GroqService,
    private readonly results: ResultsRepository,
    private readonly messages: MentorRepository,
  ) {}

  async history(userId: string, resultId: string, pathType: PathType) {
    // Najpierw sprawdzamy, czy wynik należy do użytkownika.
    const result = await this.results.findOwned(resultId, userId);
    if (!result) throw notFound('Nie znaleziono wyniku.');
    return this.messages.thread(resultId, pathType);
  }

<<<<<<< HEAD
  async chat(userId: string, resultId: string, pathType: PathType, message: string) {
    // Rozmowa korzysta z profilu i odpowiedzi zapisanych dla konkretnego wyniku.
=======
  private async prepare(
    userId: string,
    resultId: string,
    pathType: PathType,
    message: string,
  ): Promise<ChatMessage[]> {
>>>>>>> 8ae61c5ee094b413a802091bdb28071aadaebe56
    const result = await this.results.findOwned(resultId, userId);
    if (!result) throw notFound('Nie znaleziono wyniku.');
    if (!result.profile) {
      throw badRequest('Ten wynik nie ma profilu, więc mentor jest niedostępny.');
    }

    if ((await this.messages.countUserMessages(resultId)) >= MAX_USER_MESSAGES_PER_RESULT) {
      throw tooManyRequests('Osiągnięto limit wiadomości do mentora dla tego wyniku.');
    }

    const path = result.profile.paths.find((p) => p.type === pathType)!;
    const recent = await this.messages.thread(resultId, pathType, HISTORY_WINDOW);

    const conversation: ChatMessage[] = [
      // Prompt systemowy daje mentorowi kontekst, a potem dokładamy ostatnie wiadomości.
      {
        role: 'system',
        content: mentorSystemPrompt({
          path,
          archetype: result.profile.archetype,
          skills: result.profile.skills,
          roadmap: result.profile.roadmap,
          answers: formatStoredAnswers(result.answers),
        }),
      },
      ...recent.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const languageReminder: ChatMessage = {
      role: 'system',
      content:
        'Odpowiedz teraz WYŁĄCZNIE po polsku, czystym tekstem, bez Markdown (bez gwiazdek, podkreśleń, backticków i #).',
    };
    return [...conversation, languageReminder];
  }

  async chat(userId: string, resultId: string, pathType: PathType, message: string) {
    const messages = await this.prepare(userId, resultId, pathType, message);
    const ask = () => this.groq.complete(messages, CHAT_OPTIONS);

    let rawReply = await ask();
    // Jeśli model odpowie po angielsku, wykonujemy maksymalnie dwie dodatkowe próby.
    for (let attempt = 1; attempt <= 2 && looksEnglish(rawReply); attempt++) {
      this.logger.warn(`[${resultId}] Odpowiedź mentora po angielsku, ponawiam ${attempt}/2`);
      rawReply = await ask();
    }
    const reply = stripMarkdown(rawReply);

    const saved = await this.messages.saveExchange({
      resultId,
      userId,
      pathType,
      userMessage: message,
      reply,
    });
    if (!saved) this.logger.warn(`[${resultId}] Wymiana z mentorem nie zapisała się w bazie`);

    return { reply, pathType, saved };
  }

  async startStream(userId: string, resultId: string, pathType: PathType, message: string) {
    const messages = await this.prepare(userId, resultId, pathType, message);

    const events = async function* (this: MentorService, signal?: AbortSignal): AsyncGenerator<MentorStreamEvent> {
      let raw = '';
      for await (const delta of this.groq.stream(messages, CHAT_OPTIONS, signal)) {
        raw += delta;
        const text = delta.replace(/[*`]/g, '');
        if (text) yield { type: 'delta', text };
      }

      if (signal?.aborted) return;
      if (!raw.trim()) throw new Error('Groq zwrócił pustą odpowiedź.');

      if (looksEnglish(raw)) {
        this.logger.warn(`[${resultId}] Odpowiedź mentora po angielsku (stream), ponawiam bez streamu`);
        raw = await this.groq.complete(messages, CHAT_OPTIONS);
      }

      const reply = stripMarkdown(raw);
      const saved = await this.messages.saveExchange({ resultId, userId, pathType, userMessage: message, reply });
      if (!saved) this.logger.warn(`[${resultId}] Wymiana z mentorem nie zapisała się w bazie`);

      yield { type: 'done', reply, pathType, saved };
    }.bind(this);

    return { events };
  }
}