import { Controller, Get, Param, Post, Delete, UseGuards, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ResultsService } from './results.service';
import { GapAnalysisService } from './gap-analysis.service';
import { PdfService } from './pdf.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('results')
export class ResultsController {
  constructor(
    private readonly resultsService: ResultsService,
    private readonly gapAnalysisService: GapAnalysisService,
    private readonly pdfService: PdfService,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  async getResults(@CurrentUser() user: any) {
    return { items: await this.resultsService.list(user.id) };
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getResultById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.resultsService.get(user.id, id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/share')
  async shareResult(@CurrentUser() user: any, @Param('id') id: string) {
    const shareToken = await this.resultsService.share(user.id, id);
    return { shareToken };
  }

  @UseGuards(AuthGuard)
  @Delete(':id/share')
  async unshareResult(@CurrentUser() user: any, @Param('id') id: string) {
    await this.resultsService.unshare(user.id, id);
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get(':id/gap-analysis')
  async getGapAnalysis(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('pathType') pathType: string = 'safe',
  ) {
    return this.gapAnalysisService.analyzeGaps(user.id, id, pathType);
  }

  @UseGuards(AuthGuard)
  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfService.generateProfilePdf(user.id, id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=profil-kariery-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'private, no-store',
    });

    res.end(pdfBuffer);
  }
}

@Controller('share')
export class ShareController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get(':token')
  async getSharedResult(@Param('token') token: string) {
    return this.resultsService.publicCard(token);
  }
}

@Controller('compare')
export class CompareController {
  constructor(private readonly resultsService: ResultsService) {}

  @UseGuards(AuthGuard)
  @Get(':token')
  async compareResults(
    @CurrentUser() user: any,
    @Param('token') token: string,
    @Query('resultId') resultId?: string,
  ) {
    return this.resultsService.compare(user.id, token, resultId);
  }
}