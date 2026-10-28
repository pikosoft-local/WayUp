import { Injectable, Logger } from '@nestjs/common';
import { GroqService } from '../ai/groq.service';
import { EXPECTED_SENTENCES, MAX_RETRIES, SYSTEM_PROMPT } from './quiz.constants';
import { QuizSubmission } from './quiz.types';
import { countSentences, formatSubmission } from './quiz.utils';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(private readonly groq: GroqService) {}

  async generateAdvice(submission: QuizSubmission, requestId: string): Promise<string> {
    const userPrompt =
      `Oto odpowiedzi użytkownika z quizu zawodowego:\n\n${formatSubmission(submission)}\n\n` +
      `Na tej podstawie napisz spersonalizowaną sugestię dalszej ścieżki zawodowej/edukacyjnej, ` +
      `zgodnie z zasadami stylu z instrukcji systemowej.`;

    const ask = () =>
      this.groq.complete(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.85, maxTokens: 2000 },
      );

    let result = await ask();

    for (
      let attempt = 1;
      countSentences(result) !== EXPECTED_SENTENCES && attempt <= MAX_RETRIES;
      attempt++
    ) {
      this.logger.warn(
        `[${requestId}] Zła liczba zdań (${countSentences(result)}), ponawiam ${attempt}/${MAX_RETRIES}`,
      );
      result = await ask();
    }

    return result;
  }
}