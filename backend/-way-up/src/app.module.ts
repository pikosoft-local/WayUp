import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuizModule } from './quiz/quiz.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), SupabaseModule, QuizModule],
})
export class AppModule {}