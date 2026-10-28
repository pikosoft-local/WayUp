import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import type { PathType } from '../profile/profile.schema';
import { SupabaseService } from '../supabase/supabase.service';

export interface MentorMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

@Injectable()
export class MentorRepository {
  private readonly logger = new Logger(MentorRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  private get table() {
    return this.supabase.client.from('mentor_messages');
  }

  async thread(resultId: string, pathType: PathType, limit = 200): Promise<MentorMessage[]> {
    const { data, error } = await this.table
      .select('role, content, created_at')
      .eq('result_id', resultId)
      .eq('path_type', pathType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`thread: ${error.message}`);
      throw new InternalServerErrorException({ ok: false, error: 'Błąd bazy danych.' });
    }

    return (data ?? [])
      .map((row) => ({
        role: row.role as MentorMessage['role'],
        content: row.content as string,
        createdAt: row.created_at as string,
      }))
      .reverse();
  }

  async countUserMessages(resultId: string): Promise<number> {
    const { count, error } = await this.table
      .select('id', { count: 'exact', head: true })
      .eq('result_id', resultId)
      .eq('role', 'user');

    if (error) {
      this.logger.error(`countUserMessages: ${error.message}`);
      throw new InternalServerErrorException({ ok: false, error: 'Błąd bazy danych.' });
    }
    return count ?? 0;
  }

  async saveExchange(params: {
    resultId: string;
    userId: string;
    pathType: PathType;
    userMessage: string;
    reply: string;
  }): Promise<boolean> {
    const now = Date.now();
    const base = { result_id: params.resultId, user_id: params.userId, path_type: params.pathType };

    const { error } = await this.table.insert([
      { ...base, role: 'user', content: params.userMessage, created_at: new Date(now).toISOString() },
      { ...base, role: 'assistant', content: params.reply, created_at: new Date(now + 1).toISOString() },
    ]);

    if (error) {
      this.logger.error(`saveExchange: ${error.message}`);
      return false;
    }
    return true;
  }
}
