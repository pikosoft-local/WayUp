import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { QUESTIONS } from './quiz.constants';
import { QuizAnswers } from './quiz.types';

@Injectable()
export class QuizResultsService {
  private readonly logger = new Logger(QuizResultsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async save(params: {
    requestId: string;
    userId: string;
    answers: QuizAnswers;
    result: string;
  }): Promise<boolean> {
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
      return false;
    }
    return true;
  }
}