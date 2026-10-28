import { Injectable, PipeTransform } from '@nestjs/common';
import { badRequest } from '../../common/errors';
import { MAX_FOLLOW_UPS, QUESTIONS_BY_ID } from '../../questions/questions.data';
import {
  MAX_ANSWER_ITEMS,
  MAX_ANSWER_LENGTH,
  MAX_QUESTION_LENGTH,
  MIN_FILLED_ANSWERS,
} from '../quiz.constants';
import { AnswerValue, FollowUpAnswer, QuizAnswers, QuizSubmission } from '../quiz.types';
import { countFilledAnswers } from '../quiz.utils';

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

@Injectable()
export class ParseSubmissionPipe implements PipeTransform<unknown, QuizSubmission> {
  transform(body: unknown): QuizSubmission {
    if (!isPlainObject(body)) {
      throw badRequest('Nieprawidłowy format danych.');
    }

    const structured = isPlainObject(body.answers);
    const answers = this.parseAnswers(structured ? body.answers : body);
    const followUps = this.parseFollowUps(structured ? body.followUps : undefined);

    if (countFilledAnswers(answers) < MIN_FILLED_ANSWERS) {
      throw badRequest(`Uzupełnij quiz (min. ${MIN_FILLED_ANSWERS} odpowiedzi) przed wysłaniem.`);
    }

    return { answers, followUps };
  }

  private parseAnswers(raw: unknown): QuizAnswers {
    const answers: QuizAnswers = {};
    for (const [id, value] of Object.entries(raw as PlainObject)) {
      if (!QUESTIONS_BY_ID.has(id)) {
        throw badRequest(`Nieznane pytanie "${id}".`);
      }
      answers[id] = this.parseValue(value, `Nieprawidłowa odpowiedź dla pytania "${id}".`);
    }
    return answers;
  }

  private parseFollowUps(raw: unknown): FollowUpAnswer[] {
    if (raw === undefined || raw === null) return [];
    if (!Array.isArray(raw) || raw.length > MAX_FOLLOW_UPS) {
      throw badRequest(`"followUps" to lista maksymalnie ${MAX_FOLLOW_UPS} elementów.`);
    }

    return raw.map((item, index) => {
      const error = `Nieprawidłowy element followUps[${index}].`;
      if (
        !isPlainObject(item) ||
        typeof item.question !== 'string' ||
        item.question.trim() === '' ||
        item.question.length > MAX_QUESTION_LENGTH
      ) {
        throw badRequest(error);
      }
      return { question: item.question.trim(), answer: this.parseValue(item.answer, error) };
    });
  }

  private parseValue(value: unknown, error: string): AnswerValue {
    if (typeof value === 'string') {
      if (value.length > MAX_ANSWER_LENGTH) throw badRequest(error);
      return value;
    }
    if (
      Array.isArray(value) &&
      value.length <= MAX_ANSWER_ITEMS &&
      value.every((item) => typeof item === 'string' && item.length <= MAX_ANSWER_LENGTH)
    ) {
      return value as string[];
    }
    throw badRequest(error);
  }
}
