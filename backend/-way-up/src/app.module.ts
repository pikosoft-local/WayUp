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
<<<<<<< HEAD
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AiModule,
    QuestionsModule,
    QuizModule,
    ResultsModule,
    MentorModule,
=======
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    SupabaseModule,
    QuizModule,
>>>>>>> 5efc24a14b9399c26500a4880e932096c26f1ef8
  ],
})
export class AppModule {}