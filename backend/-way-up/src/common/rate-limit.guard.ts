// Guard ograniczający liczbę żądań, aby chronić endpointy przed spamem.
import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tooManyRequests } from './errors';

export interface RateLimitOptions {
  name: string;
  limit: number;
  windowSec: number;
}

const RATE_LIMIT_KEY = 'rate-limit';

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

const buckets = new Map<string, number[]>();
// Po przekroczeniu tej liczby kluczy usuwamy stare wpisy z pamięci.
const SWEEP_THRESHOLD = 5000;

export interface ConsumeResult {
  allowed: boolean;
  retryAfterSec: number;
}

export function consume(key: string, limit: number, windowMs: number, now = Date.now()): ConsumeResult {
  // Zostawiamy tylko żądania z aktualnego okna czasowego.
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) };
  }

  hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > SWEEP_THRESHOLD) {
    for (const [k, v] of buckets) {
      if (v.length === 0 || now - v[v.length - 1] >= windowMs) buckets.delete(k);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function resetRateLimits(): void {
  buckets.clear();
}

function clientIp(req: any): string {
  // Za proxy prawdziwy adres klienta jest zwykle w x-forwarded-for.
  const forwarded = req.headers?.['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.ip || req.socket?.remoteAddress || 'unknown';
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Brak dekoratora oznacza, że dany endpoint nie ma limitu.
    const options = this.reflector.get<RateLimitOptions | undefined>(RATE_LIMIT_KEY, context.getHandler());
    if (!options) return true;

    const http = context.switchToHttp();
    const req = http.getRequest();
    const who = req.user?.id ?? clientIp(req);

    const result = consume(`${options.name}:${who}`, options.limit, options.windowSec * 1000);
    if (!result.allowed) {
      http.getResponse().setHeader('Retry-After', String(result.retryAfterSec));
      throw tooManyRequests(`Za dużo zapytań. Spróbuj ponownie za ${result.retryAfterSec} s.`);
    }
    return true;
  }
}