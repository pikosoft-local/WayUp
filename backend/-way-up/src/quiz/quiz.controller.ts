import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthGuard } from '../auth/auth.guard';
import { RateLimit, RateLimitGuard } from '../common/rate-limit.guard';
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

  @Post('SendHandler')
  @UseGuards(RateLimitGuard)
  @RateLimit({ name: 'send', limit: 5, windowSec: 600 })
  @HttpCode(HttpStatus.OK)
  async sendHandler(
    @Body(ParseSubmissionPipe) submission: QuizSubmission,
    @CurrentUser() user: AuthUser,
  ): Promise<QuizSuccessResponse> {
    const requestId = randomUUID();
    this.logger.log(
      `[${requestId}] user=${user.id} ${JSON.stringify({ answers: submission.answers, followUps: submission.followUps })}`,
    );

    let result: string;
    let profile: Profile | null;
    try {
      [result, profile] = await Promise.all([
        this.quizService.generateAdvice(submission, requestId),
        this.profileService.generate(submission, requestId),
      ]);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(
        `[${requestId}] ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException({
        ok: false,
        error: 'Nie udało się wygenerować odpowiedzi.',
      });
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