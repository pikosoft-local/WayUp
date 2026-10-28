import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { MentorModule } from './mentor/mentor.module';
import { QuestionsModule } from './questions/questions.module';
import { QuizModule } from './quiz/quiz.module';
import { ResultsModule } from './results/results.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AiModule,
    QuestionsModule,
    QuizModule,
    ResultsModule,
    MentorModule,
  ],
})
export class AppModule {}