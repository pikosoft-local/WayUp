import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { UUID_PIPE } from '../common/errors';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PATH_TYPES, PathType } from '../profile/profile.schema';
import { MentorService } from './mentor.service';

const chatBodySchema = z.object({
  pathType: z.enum(PATH_TYPES),
  message: z.string().trim().min(1).max(1000),
});
type ChatBody = z.output<typeof chatBodySchema>;

const historyQuerySchema = z.object({ pathType: z.enum(PATH_TYPES) });

@Controller('results/:id/chat')
@UseGuards(AuthGuard)
export class MentorController {
  constructor(private readonly mentor: MentorService) {}

  @Get()
  async history(
    @Param('id', UUID_PIPE) id: string,
    @Query(new ZodValidationPipe(historyQuerySchema)) query: { pathType: PathType },
    @CurrentUser() user: AuthUser,
  ) {
    return { ok: true, messages: await this.mentor.history(user.id, id, query.pathType) };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async chat(
    @Param('id', UUID_PIPE) id: string,
    @Body(new ZodValidationPipe(chatBodySchema)) body: ChatBody,
    @CurrentUser() user: AuthUser,
  ) {
    const reply = await this.mentor.chat(user.id, id, body.pathType, body.message);
    return { ok: true, ...reply };
  }
}
