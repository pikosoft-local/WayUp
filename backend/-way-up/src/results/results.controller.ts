import { Controller, Delete, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { UUID_PIPE } from '../common/errors';
import { GapAnalysisService } from './gap-analysis.service';
import { PdfService } from './pdf.service';
import { ResultsService } from './results.service';

@Controller('results')
@UseGuards(AuthGuard)
export class ResultsController {
  constructor(
    private readonly resultsService: ResultsService,
    private readonly gapAnalysisService: GapAnalysisService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  async getResults(@CurrentUser() user: AuthUser) {
    return { ok: true, items: await this.resultsService.list(user.id) };
  }

  @Get(':id')
  async getResultById(@CurrentUser() user: AuthUser, @Param('id', UUID_PIPE) id: string) {
    return { ok: true, ...(await this.resultsService.get(user.id, id)) };
  }

  @Post(':id/share')
  async shareResult(@CurrentUser() user: AuthUser, @Param('id', UUID_PIPE) id: string) {
    return { ok: true, shareToken: await this.resultsService.share(user.id, id) };
  }

  @Delete(':id/share')
  async unshareResult(@CurrentUser() user: AuthUser, @Param('id', UUID_PIPE) id: string) {
    await this.resultsService.unshare(user.id, id);
    return { ok: true };
  }

  @Get(':id/gap-analysis')
  async getGapAnalysis(
    @CurrentUser() user: AuthUser,
    @Param('id', UUID_PIPE) id: string,
    @Query('pathType') pathType: string = 'safe',
  ) {
    return this.gapAnalysisService.analyzeGaps(user.id, id, pathType);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser() user: AuthUser,
    @Param('id', UUID_PIPE) id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfService.generateProfilePdf(user.id, id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=profil-kariery-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}

@Controller('share')
export class ShareController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get(':token')
  async getSharedResult(@Param('token') token: string) {
    return { ok: true, card: await this.resultsService.publicCard(token) };
  }
}

@Controller('compare')
export class CompareController {
  constructor(private readonly resultsService: ResultsService) {}

  @UseGuards(AuthGuard)
  @Get(':token')
  async compareResults(
    @CurrentUser() user: AuthUser,
    @Param('token') token: string,
    @Query('resultId') resultId?: string,
  ) {
    return { ok: true, ...(await this.resultsService.compare(user.id, token, resultId)) };
  }
}