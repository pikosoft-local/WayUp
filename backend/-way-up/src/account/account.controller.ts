// Endpointy konta użytkownika, na przykład usuwanie własnego konta.
import { Body, Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { UUID_PIPE } from '../common/errors';
import { RateLimit, RateLimitGuard } from '../common/rate-limit.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AccountService } from './account.service';

export const DELETE_ACCOUNT_CONFIRMATION = 'USUŃ';

const deleteAccountSchema = z.object({ confirm: z.literal(DELETE_ACCOUNT_CONFIRMATION) });

@Controller()
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Delete('results/:id')
  @UseGuards(RateLimitGuard)
  @RateLimit({ name: 'delete-result', limit: 20, windowSec: 60 })
  async deleteResult(@Param('id', UUID_PIPE) id: string, @CurrentUser() user: AuthUser) {
    await this.account.deleteResult(user.id, id);
    return { ok: true };
  }

  @Delete('account')
  @UseGuards(RateLimitGuard)
  @RateLimit({ name: 'delete-account', limit: 3, windowSec: 600 })
  async deleteAccount(
    @Body(new ZodValidationPipe(deleteAccountSchema)) _body: z.output<typeof deleteAccountSchema>,
    @CurrentUser() user: AuthUser,
  ) {
    await this.account.deleteAccount(user.id);
    return { ok: true };
  }
}