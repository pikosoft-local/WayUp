import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { QUESTIONS } from './quiz.constants';
import { QuizAnswers, QuizResultRecord } from './quiz.types';

@Injectable()
export class QuizResultsService {
  private readonly logger = new Logger(QuizResultsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async save(params: {
    requestId: string;
    userId: string;
    answers: QuizAnswers;
    result: string;
  }): Promise<void> {
    const { requestId, userId, answers, result } = params;

    const qa = Object.entries(answers).map(([id, answer]) => ({
      id,
      question: QUESTIONS[id] ?? id,
      answer,
    }));

    const { error } = await this.supabase.client.from('quiz_results').insert({
      id: requestId,
      user_id: userId,
      answers: qa,
      result,
    });

    if (error) {
      this.logger.error(`[${requestId}] Zapis do Supabase nieudany: ${error.message}`);
      throw new InternalServerErrorException({
        ok: false,
        error: 'Wynik został wygenerowany, ale nie udało się zapisać go na koncie.',
      });
    }
  }

  async listForUser(userId: string): Promise<QuizResultRecord[]> {
    const { data, error } = await this.supabase.client
      .from('quiz_results')
      .select('id, answers, result, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<QuizResultRecord[]>();

    if (error) {
      this.logger.error(`Nie udało się pobrać wyników użytkownika ${userId}: ${error.message}`);
      throw new InternalServerErrorException({
        ok: false,
        error: 'Nie udało się pobrać zapisanych wyników.',
      });
    }

    return data;
  }
}