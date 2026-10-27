import { Injectable, Logger } from '@nestjs/common';
import { GroqService } from './groq.service';
import { EXPECTED_SENTENCES, MAX_RETRIES } from './quiz.constants';
import { QuizAnswers } from './quiz.types';
import { countSentences } from './quiz.utils';

@Injectable()
export class QuizService {
    private readonly logger = new Logger(QuizService.name);

    constructor(private readonly groq: GroqService) {}

    async generateAdvice(answers: QuizAnswers, requestId: string): Promise<string> {
        let result = await this.groq.generateAdvice(answers);

        for (
            let attempt = 1;
            countSentences(result) !== EXPECTED_SENTENCES && attempt <= MAX_RETRIES;
            attempt++
        ) {
            this.logger.warn(
                `[${requestId}] Zła liczba zdań (${countSentences(result)}), ponawiam ${attempt}/${MAX_RETRIES}`,
            );
            result = await this.groq.generateAdvice(answers);
        }

        return result;
    }
}