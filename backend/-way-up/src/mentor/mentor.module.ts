import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ResultsModule } from '../results/results.module';
import { MentorController } from './mentor.controller';
import { MentorRepository } from './mentor.repository';
import { MentorService } from './mentor.service';

@Module({
  imports: [AiModule, ResultsModule],
  controllers: [MentorController],
  providers: [MentorService, MentorRepository],
})
export class MentorModule {}
