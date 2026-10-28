import { Module } from '@nestjs/common';
import { ResultsController, ShareController, CompareController } from './results.controller';
import { ResultsService } from './results.service';
import { ResultsRepository } from './results.repository';
import { GapAnalysisService } from './gap-analysis.service';
import { PdfService } from './pdf.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ResultsController, ShareController, CompareController],
  providers: [ResultsService, ResultsRepository, GapAnalysisService, PdfService],
  exports: [ResultsService, ResultsRepository],
})
export class ResultsModule {}