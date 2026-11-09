import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { notFound } from '../common/errors';
import { MentorRepository } from '../mentor/mentor.repository';
import { ResultsRepository } from '../results/results.repository';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly results: ResultsRepository,
    private readonly mentor: MentorRepository,
  ) {}

  async deleteResult(userId: string, resultId: string): Promise<void> {
    const owned = await this.results.findOwned(resultId, userId);
    if (!owned) throw notFound('Nie znaleziono wyniku.');

    await this.mentor.deleteByResult(resultId, userId);
    const deleted = await this.results.deleteOwned(resultId, userId);
    if (!deleted) throw notFound('Nie znaleziono wyniku.');

    this.logger.log(`Usunięto wynik ${resultId} (user=${userId})`);
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.mentor.deleteAllByUser(userId);
    const removedResults = await this.results.deleteAllByUser(userId);

    const { error } = await this.supabase.client.auth.admin.deleteUser(userId);
    if (error && error.status !== 404 && !/not.?found/i.test(error.message)) {
      this.logger.error(`Nie udało się usunąć konta user=${userId}: ${error.message}`);
      throw new InternalServerErrorException({
        ok: false,
        error: 'Twoje dane zostały usunięte, ale nie udało się usunąć samego konta. Spróbuj ponownie.',
      });
    }

    this.logger.log(`Usunięto konto user=${userId} (wyniki: ${removedResults})`);
  }
}