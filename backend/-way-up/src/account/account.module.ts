// Moduł konta. Rejestruje kontroler i serwis związany z kontem użytkownika.
import { Module } from '@nestjs/common';
import { MentorModule } from '../mentor/mentor.module';
import { ResultsModule } from '../results/results.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [SupabaseModule, ResultsModule, MentorModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}