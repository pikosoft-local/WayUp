import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedRequest } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException({
        ok: false,
        error: 'Zaloguj się, żeby korzystać z quizu.',
      });
    }

    const { data, error } = await this.supabase.client.auth.getUser(token);
    if (error || !data.user) {
      this.logger.warn(`Odrzucony token: ${error?.message ?? 'brak użytkownika'}`);
      throw new UnauthorizedException({
        ok: false,
        error: 'Sesja wygasła lub jest nieprawidłowa. Zaloguj się ponownie.',
      });
    }

    request.user = { id: data.user.id, email: data.user.email };
    return true;
  }

  private extractToken(header?: string): string | null {
    const [scheme, token] = header?.split(' ') ?? [];
    return scheme?.toLowerCase() === 'bearer' && token ? token : null;
  }
}