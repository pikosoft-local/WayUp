import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RateLimit, RateLimitGuard } from '../common/rate-limit.guard';
import { ParseSubmissionPipe } from '../quiz/pipes/parse-submission.pipe';
import { QuizSubmission } from '../quiz/quiz.types';
import {
  BLOCKS,
  MAX_FOLLOW_UPS,
  QUESTION_BANK,
  QUESTIONS_VERSION,
  SLIDER_MAX,
  SLIDER_MIN,
} from './questions.data';
import { QuestionsService } from './questions.service';
import { QuestionsTokenService } from './questions-token.service';

@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questions: QuestionsService,
    private readonly tokens: QuestionsTokenService,
  ) {}

  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit({ name: 'questions', limit: 30, windowSec: 60 })
  async list() {
    const dynamic = await this.questions.generateDynamicQuestions();
    const allQuestions = [...QUESTION_BANK.filter((q) => q.block === 1), ...dynamic];
    return {
      ok: true,
      version: QUESTIONS_VERSION,
      slider: { min: SLIDER_MIN, max: SLIDER_MAX },
      maxFollowUps: MAX_FOLLOW_UPS,
      questionsToken: this.tokens.sign(dynamic),
      blocks: BLOCKS.map((block) => ({
        id: block.id,
        title: block.title,
        questions: allQuestions.filter((q) => q.block === block.id).map(
          ({ id, type, text, options, minLabel, maxLabel }) => ({
            id,
            type,
            text,
            ...(options && { options }),
            ...(minLabel && { minLabel }),
            ...(maxLabel && { maxLabel }),
          }),
        ),
      })),
    };
  }

  @Post('follow-up')
  @UseGuards(AuthGuard, RateLimitGuard)
  @RateLimit({ name: 'follow-up', limit: 10, windowSec: 60 })
  @HttpCode(HttpStatus.OK)
  async followUp(@Body(ParseSubmissionPipe) submission: QuizSubmission) {
    const alreadyAsked = Array.isArray(submission.followUps)
      ? submission.followUps.map((item) => item.question).filter(Boolean)
      : [];
    const question = await this.questions.generateFollowUp(submission, alreadyAsked);
    return { ok: true, question };
  }
}