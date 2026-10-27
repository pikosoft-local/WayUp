import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { GroqService } from './groq.service';
import { QuizController } from './quiz.controller';
import { QuizResultsService } from './quiz-results.service'
import { QuizService } from './quiz.service';

@Module({
    controllers: [QuizController],
    providers: [QuizService, GroqService, QuizResultsService, AuthGuard],
})
export class QuizModule {}