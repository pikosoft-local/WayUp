import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    InternalServerErrorException,
    Logger,
    Post,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ParseAnswersPipe } from './pipes/parse-answers.pipe';
import { QuizService } from './quiz.service';
import { QuizAnswers, QuizSuccessResponse} from './quiz.types';

@Controller()
export class QuizController {
    private readonly logger = new Logger(QuizController.name);

    constructor(private readonly quizService: QuizService) {}

    @Post('SendHandler')
    @HttpCode(HttpStatus.OK)
    async sendHandler(
        @Body(ParseAnswersPipe) answers: QuizAnswers,
    ): Promise<QuizSuccessResponse> {
        const requestId = randomUUID();
        this.logger.log(`[${requestId}] ${JSON.stringify(answers)}`);

        try {
            const result = await this.quizService.generateAdvice(answers, requestId);
            return { ok: true, result, requestId}
        } catch (err) {
            this.logger.error(
                `[${requestId}] ${err instanceof Error ? err.message : String(err)}`,
                err instanceof Error ? err.stack : undefined,
            );
            throw new InternalServerErrorException({
                ok: false,
                error: 'Nie udało się wygenerować odpowiedzi',
            });
        }
    }
}