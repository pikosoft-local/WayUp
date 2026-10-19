import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), QuizModule],
})
export class AppModule {}