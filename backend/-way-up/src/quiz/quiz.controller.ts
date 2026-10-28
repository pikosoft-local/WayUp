import {
<<<<<<< HEAD
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
  UseGuards,
=======
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    InternalServerErrorException,
    Logger,
    Post,
    UseGuards,
>>>>>>> 5efc24a14b9399c26500a4880e932096c26f1ef8
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { Profile } from '../profile/profile.schema';
import { ProfileService } from '../profile/profile.service';
import { ResultsRepository } from '../results/results.repository';
import { ParseSubmissionPipe } from './pipes/parse-submission.pipe';
import { QuizService } from './quiz.service';
import { QuizSubmission, QuizSuccessResponse } from './quiz.types';
import { toStoredAnswers } from './quiz.utils';

@Controller()
@UseGuards(AuthGuard)
export class QuizController {
  private readonly logger = new Logger(QuizController.name);

  constructor(
    private readonly quizService: QuizService,
    private readonly profileService: ProfileService,
    private readonly results: ResultsRepository,
  ) {}

<<<<<<< HEAD
  @Post('SendHandler')
  @HttpCode(HttpStatus.OK)
  async sendHandler(
    @Body(ParseSubmissionPipe) submission: QuizSubmission,
    @CurrentUser() user: AuthUser,
  ): Promise<QuizSuccessResponse> {
    const requestId = randomUUID();
    this.logger.log(`[${requestId}] user=${user.id} ${JSON.stringify(submission)}`);

    let result: string;
    let profile: Profile | null;
    try {
      // Porada i profil generują się równolegle; profile.generate nigdy nie rzuca.
      [result, profile] = await Promise.all([
        this.quizService.generateAdvice(submission, requestId),
        this.profileService.generate(submission, requestId),
      ]);
    } catch (err) {
      this.logger.error(
        `[${requestId}] ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException({
        ok: false,
        error: 'Nie udało się wygenerować odpowiedzi.',
      });
=======
    @Post('SendHandler')
    @HttpCode(HttpStatus.OK)
    async sendHandler(
        @Body(ParseAnswersPipe) answers: QuizAnswers,
        @CurrentUser() user: AuthUser,
    ): Promise<QuizSuccessResponse> {
        const requestId = randomUUID();
        this.logger.log(`[${requestId}] user=${user.id} quiz submitted`);

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

        await this.quizResults.save({
            requestId,
            userId: user.id,
            answers,
            result,
        });

        return { ok: true, result, requestId, saved: true };
    }

    @Get('quiz-results')
    async getResults(@CurrentUser() user: AuthUser) {
        const results = await this.quizResults.listForUser(user.id);
        return { ok: true, results };
>>>>>>> 5efc24a14b9399c26500a4880e932096c26f1ef8
    }

    const saved = await this.results.insert({
      id: requestId,
      user_id: user.id,
      answers: toStoredAnswers(submission),
      result,
      profile,
    });

    return { ok: true, result, requestId, saved, profile };
  }
}