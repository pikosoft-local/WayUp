import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { MIN_FILLED_ANSWERS } from '../quiz.constants';
import { QuizAnswers } from '../quiz.types';
import { countFilledAnswers } from '../quiz.utils';

@Injectable()
export class ParseAnswersPipe implements PipeTransform<unknown, QuizAnswers> {
  transform(body: unknown): QuizAnswers {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new BadRequestException({
        ok: false,
        error: 'Nieprawidłowy format danych.',
      });
    }

    const answers: QuizAnswers = {};

    for (const [key, value] of Object.entries(body)) {
      const isString = typeof value === 'string';
      const isStringArray =
        Array.isArray(value) && value.every((item) => typeof item === 'string');

      if (!isString && !isStringArray) {
        throw new BadRequestException({
          ok: false,
          error: `Nieprawidłowa odpowiedź dla pytania "${key}".`,
        });
      }

      answers[key] = value as string | string[];
    }

    const filled = countFilledAnswers(answers);
    if (filled < MIN_FILLED_ANSWERS) {
      throw new BadRequestException({
        ok: false,
        error: `Uzupełnij quiz (min. ${MIN_FILLED_ANSWERS} odpowiedzi) przed wysłaniem.`,
      });
    }

    return answers;
  }
}