import { Module } from '@nestjs/common';
import { GroqService } from './groq.service';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
    controllers: [QuizController],
    providers: [QuizService, GroqService],
})
export class QuizModule {}