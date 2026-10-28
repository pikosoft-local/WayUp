import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js';
import type { Profile } from '../profile/profile.schema';
import type { StoredAnswer } from '../quiz/quiz.types';
import { SupabaseService } from '../supabase/supabase.service';

export interface ResultRow {
  id: string;
  user_id: string;
  answers: StoredAnswer[];
  result: string;
  profile: Profile | null;
  share_token: string | null;
  created_at: string;
}

export type NewResult = Pick<ResultRow, 'id' | 'user_id' | 'answers' | 'result'> & {
  profile: Profile | null;
};

@Injectable()
export class ResultsRepository {
  private readonly logger = new Logger(ResultsRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  private get table() {
    return this.supabase.client.from('quiz_results');
  }

  private fail(operation: string, error: PostgrestError): never {
    this.logger.error(`${operation}: ${error.message}`);
    throw new InternalServerErrorException({ ok: false, error: 'Błąd bazy danych.' });
  }

  async insert(row: NewResult): Promise<boolean> {
    const { profile, ...rest } = row;
    const { error } = await this.table.insert({ ...rest, ...(profile && { profile }) });
    if (error) {
      this.logger.error(`[${row.id}] Zapis wyniku nieudany: ${error.message}`);
      return false;
    }
    return true;
  }

  async listByUser(userId: string, limit = 50): Promise<ResultRow[]> {
    const { data, error } = await this.table
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) this.fail('listByUser', error);
    return (data ?? []) as ResultRow[];
  }

  async findOwned(id: string, userId: string): Promise<ResultRow | null> {
    const { data, error } = await this.table
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) this.fail('findOwned', error);
    return (data as ResultRow | null) ?? null;
  }

  async findLatestWithProfile(userId: string): Promise<ResultRow | null> {
    const { data, error } = await this.table
      .select('*')
      .eq('user_id', userId)
      .not('profile', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) this.fail('findLatestWithProfile', error);
    return (data as ResultRow | null) ?? null;
  }

  async findByShareToken(token: string): Promise<ResultRow | null> {
    const { data, error } = await this.table
      .select('*')
      .eq('share_token', token)
      .maybeSingle();
    if (error) this.fail('findByShareToken', error);
    return (data as ResultRow | null) ?? null;
  }

  async setShareToken(id: string, userId: string, token: string | null): Promise<boolean> {
    const { data, error } = await this.table
      .update({ share_token: token })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');
    if (error) this.fail('setShareToken', error);
    return (data?.length ?? 0) > 0;
  }
}
