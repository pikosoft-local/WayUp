import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    InternalServerErrorException,
    Logger,
    Post,
    UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { ParseAnswersPipe } from './pipes/parse-answers.pipe';
import { QuizResultsService } from './quiz-results.service';
import { QuizService } from './quiz.service';
import { QuizAnswers, QuizSuccessResponse} from './quiz.types';
import { request } from 'node:http';

@Controller()
@UseGuards(AuthGuard)
export class QuizController {
    private readonly logger = new Logger(QuizController.name);

    constructor(
        private readonly quizService: QuizService,
        private readonly quizResults: QuizResultsService,
    ) {}

    @Post('SendHandler')
    @HttpCode(HttpStatus.OK)
    async sendHandler(
        @Body(ParseAnswersPipe) answers: QuizAnswers,
        @CurrentUser() user: AuthUser,
    ): Promise<QuizSuccessResponse> {
        const requestId = randomUUID();
        this.logger.log(`[${requestId}] user=${user.id} ${JSON.stringify(answers)}`);

        let result: string
        try {
            result = await this.quizService.generateAdvice(answers, requestId);
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

        const saved = await this.quizResults.save({
            requestId,
            userId: user.id,
            answers,
            result,
        });

        return { ok: true, result, requestId, saved };
    }
}