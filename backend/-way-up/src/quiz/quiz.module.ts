import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ProfileService } from '../profile/profile.service';
import { ResultsModule } from '../results/results.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [AiModule, ResultsModule],
  controllers: [QuizController],
  providers: [QuizService, ProfileService],
})
export class QuizModule {}