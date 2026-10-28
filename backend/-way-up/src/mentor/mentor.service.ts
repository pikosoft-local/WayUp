import { Injectable, Logger } from '@nestjs/common';
import { ChatMessage, GroqService } from '../ai/groq.service';
import { badRequest, notFound, tooManyRequests } from '../common/errors';
import { PathType } from '../profile/profile.schema';
import { formatStoredAnswers } from './mentor.format';
import { mentorSystemPrompt } from './mentor.prompts';
import { MentorRepository } from './mentor.repository';
import { ResultsRepository } from '../results/results.repository';

export const MAX_USER_MESSAGES_PER_RESULT = 50;
const HISTORY_WINDOW = 12;

@Injectable()
export class MentorService {
  private readonly logger = new Logger(MentorService.name);

  constructor(
    private readonly groq: GroqService,
    private readonly results: ResultsRepository,
    private readonly messages: MentorRepository,
  ) {}

  async history(userId: string, resultId: string, pathType: PathType) {
    const result = await this.results.findOwned(resultId, userId);
    if (!result) throw notFound('Nie znaleziono wyniku.');
    return this.messages.thread(resultId, pathType);
  }

  async chat(userId: string, resultId: string, pathType: PathType, message: string) {
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

    const reply = await this.groq.complete(conversation, { temperature: 0.8, maxTokens: 1500 });

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
}
