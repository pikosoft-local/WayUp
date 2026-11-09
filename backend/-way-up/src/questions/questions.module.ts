// Moduł pytań quizowych.
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsTokenService } from './questions-token.service';

@Module({
  imports: [AiModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsTokenService],
  exports: [QuestionsTokenService],
})
export class QuestionsModule {}