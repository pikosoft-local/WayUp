// Serwis tworzący i sprawdzający token zestawu pytań quizu.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Question, QuestionType } from './questions.types';

const TOKEN_VERSION = 1;
const DEFAULT_TTL_SEC = 24 * 60 * 60;
const TYPES: QuestionType[] = ['text', 'choice', 'multi', 'slider'];

interface TokenQuestion {
  id: string;
  block: number;
  type: QuestionType;
  label: string;
  text: string;
  options?: string[];
  minLabel?: string;
  maxLabel?: string;
}

interface TokenPayload {
  v: number;
  exp: number;
  q: TokenQuestion[];
}

const b64 = (buf: Buffer) => buf.toString('base64url');

@Injectable()
export class QuestionsTokenService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const secret =
      config.get<string>('QUESTIONS_SECRET') ?? config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.key = createHash('sha256').update(`questions-token:${secret}`).digest();
  }

  sign(questions: Question[], ttlSec = DEFAULT_TTL_SEC): string {
    const payload: TokenPayload = {
      v: TOKEN_VERSION,
      exp: Math.floor(Date.now() / 1000) + ttlSec,
      q: questions.map((q) => ({
        id: q.id,
        block: q.block,
        type: q.type,
        label: q.label,
        text: q.text,
        ...(q.options && { options: q.options.map((o) => o.label) }),
        ...(q.minLabel && { minLabel: q.minLabel }),
        ...(q.maxLabel && { maxLabel: q.maxLabel }),
      })),
    };
    const body = b64(Buffer.from(JSON.stringify(payload), 'utf8'));
    return `${body}.${this.signature(body)}`;
  }

  /** Zwraca pytania z tokenu albo null, gdy token jest zły, podrobiony lub wygasł. */
  verify(token: string): Question[] | null {
    const [body, sig, extra] = token.split('.');
    if (!body || !sig || extra !== undefined) return null;

    const expected = Buffer.from(this.signature(body));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

    let payload: TokenPayload;
    try {
      payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      return null;
    }
    if (payload?.v !== TOKEN_VERSION || typeof payload.exp !== 'number' || !Array.isArray(payload.q)) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    const questions: Question[] = [];
    for (const q of payload.q) {
      if (!q || typeof q.id !== 'string' || typeof q.text !== 'string' || !TYPES.includes(q.type)) return null;
      questions.push({
        id: q.id,
        block: q.block,
        type: q.type,
        label: q.label,
        text: q.text,
        ...(q.options && { options: q.options.map((label, i) => ({ id: `o${i + 1}`, label })) }),
        ...(q.minLabel && { minLabel: q.minLabel }),
        ...(q.maxLabel && { maxLabel: q.maxLabel }),
      });
    }
    return questions;
  }

  private signature(body: string): string {
    return b64(createHmac('sha256', this.key).update(body).digest());
  }
}