import { Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';
import { badRequest } from './errors';

@Injectable()
export class ZodValidationPipe<S extends z.ZodType> implements PipeTransform<unknown, z.output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const where = issue?.path.length ? ` (pole: ${issue.path.join('.')})` : '';
      throw badRequest(`Nieprawidłowe dane${where}.`);
    }
    return parsed.data;
  }
}
