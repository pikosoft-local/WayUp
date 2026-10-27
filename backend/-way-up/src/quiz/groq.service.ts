import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { SYSTEM_PROMPT } from './quiz.constants';
import { QuizAnswers } from './quiz.types';
import { formatAnswers } from './quiz.utils';

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly client: Groq;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Groq({
      apiKey: this.config.getOrThrow<string>('GROQ_API_KEY'),
    });
    this.model = this.config.get<string>('GROQ_MODEL') ?? 'openai/gpt-oss-20b';
  }

  async generateAdvice(answers: QuizAnswers): Promise<string> {
    const userPrompt =
      `Oto odpowiedzi użytkownika z quizu zawodowego:\n\n${formatAnswers(answers)}\n\n` +
      `Na tej podstawie napisz spersonalizowaną sugestię dalszej ścieżki zawodowej/edukacyjnej, ` +
      `zgodnie z zasadami stylu z instrukcji systemowej.`;

    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.85,
      max_completion_tokens: 2000,
      reasoning_effort: 'low',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const choice = completion.choices[0];
    const content = choice?.message?.content?.trim();
    if (!content) {
      throw new Error(
        `Groq zwrócił pustą odpowiedź (finish_reason: ${choice?.finish_reason ?? 'brak'}).`,
      );
    }

    return content;
  }
}