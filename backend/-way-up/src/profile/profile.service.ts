import { Injectable, Logger } from '@nestjs/common';
import { extractJson } from '../ai/extract-json';
import { GroqService } from '../ai/groq.service';
import { QuizSubmission } from '../quiz/quiz.types';
import { formatSubmission } from '../quiz/quiz.utils';
import { PROFILE_SYSTEM_PROMPT, profileUserPrompt } from './profile.prompts';
import { PROFILE_DISCLAIMER, Profile, profileSchema } from './profile.schema';

const MAX_ATTEMPTS = 2;

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly groq: GroqService) {}

  async generate(submission: QuizSubmission, requestId: string): Promise<Profile | null> {
    const messages = [
      { role: 'system' as const, content: PROFILE_SYSTEM_PROMPT },
      { role: 'user' as const, content: profileUserPrompt(formatSubmission(submission)) },
    ];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const raw = await this.groq.complete(messages, {
          json: true,
          temperature: 0.7,
          maxTokens: 4000,
        });

        const parsed = profileSchema.safeParse(extractJson(raw));
        if (parsed.success) {
          return { ...parsed.data, disclaimer: PROFILE_DISCLAIMER };
        }

        const problems = parsed.error.issues
          .slice(0, 3)
          .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
          .join(' | ');
        this.logger.warn(`[${requestId}] Profil niezgodny ze schematem (próba ${attempt}): ${problems}`);
      } catch (err) {
        this.logger.warn(
          `[${requestId}] Błąd generowania profilu (próba ${attempt}): ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return null;
  }
}
