import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import { AiModule } from './ai/ai.module';
import { MentorModule } from './mentor/mentor.module';
import { NewsModule } from './news/news.module';
import { QuestionsModule } from './questions/questions.module';
import { QuizModule } from './quiz/quiz.module';
import { ResultsModule } from './results/results.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    // ConfigModule ładuje zmienne środowiskowe i udostępnia je w całej aplikacji.
    ConfigModule.forRoot({ isGlobal: true }),
    // Każdy moduł grupuje powiązane endpointy i serwisy konkretnej funkcji.
    SupabaseModule,
    AiModule,
    QuestionsModule,
    QuizModule,
    ResultsModule,
    MentorModule,
    NewsModule,
    AccountModule,
  ],
})
export class AppModule {}