// Endpointy rozmowy z mentorem AI.
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { AiOverloadedException } from '../ai/groq.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { UUID_PIPE } from '../common/errors';
import { RateLimit, RateLimitGuard } from '../common/rate-limit.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PATH_TYPES, PathType } from '../profile/profile.schema';
import { MentorService } from './mentor.service';

const MENTOR_LIMIT = { name: 'mentor', limit: 15, windowSec: 60 } as const;

const chatBodySchema = z.object({
  // Walidujemy tekst rozmowy przed przekazaniem go do modelu AI.
  pathType: z.enum(PATH_TYPES),
  message: z.string().trim().min(1).max(1000),
});
type ChatBody = z.output<typeof chatBodySchema>;

const historyQuerySchema = z.object({ pathType: z.enum(PATH_TYPES) });

@Controller('results/:id/chat')
@UseGuards(AuthGuard)
export class MentorController {
  private readonly logger = new Logger(MentorController.name);

  constructor(private readonly mentor: MentorService) {}

  @Get()
  async history(
    // Historia jest dostępna tylko dla właściciela wyniku, co sprawdza serwis.
    @Param('id', UUID_PIPE) id: string,
    @Query(new ZodValidationPipe(historyQuerySchema)) query: { pathType: PathType },
    @CurrentUser() user: AuthUser,
  ) {
    return { ok: true, messages: await this.mentor.history(user.id, id, query.pathType) };
  }

  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit(MENTOR_LIMIT)
  @HttpCode(HttpStatus.OK)
  async chat(
    @Param('id', UUID_PIPE) id: string,
    @Body(new ZodValidationPipe(chatBodySchema)) body: ChatBody,
    @CurrentUser() user: AuthUser,
  ) {
    const reply = await this.mentor.chat(user.id, id, body.pathType, body.message);
    return { ok: true, ...reply };
  }

  @Post('stream')
  @UseGuards(RateLimitGuard)
  @RateLimit(MENTOR_LIMIT)
  async chatStream(
    @Param('id', UUID_PIPE) id: string,
    @Body(new ZodValidationPipe(chatBodySchema)) body: ChatBody,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const session = await this.mentor.startStream(user.id, id, body.pathType, body.message);

    res.status(HttpStatus.OK).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const abort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) abort.abort();
    });

    try {
      for await (const event of session.events(abort.signal)) {
        if (event.type === 'delta') send('delta', { text: event.text });
        else send('done', { ok: true, reply: event.reply, pathType: event.pathType, saved: event.saved });
      }
    } catch (err) {
      this.logger.error(
        `Błąd streamu mentora: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      send('error', {
        ok: false,
        error:
          err instanceof AiOverloadedException
            ? 'Serwer AI jest chwilowo przeciążony. Spróbuj ponownie za chwilę.'
            : 'Nie udało się wygenerować odpowiedzi.',
      });
    } finally {
      res.end();
    }
  }
}