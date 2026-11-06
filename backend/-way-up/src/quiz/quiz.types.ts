import type { Profile } from '../profile/profile.schema';
import type { Question } from '../questions/questions.types';

export type AnswerValue = string | string[];

export type QuizAnswers = Record<string, AnswerValue>;

export interface FollowUpAnswer {
  question: string;
  answer: AnswerValue;
}

export interface QuizSubmission {
  answers: QuizAnswers;
  followUps: FollowUpAnswer[];
  questions?: ReadonlyMap<string, Question>;
}

export interface StoredAnswer {
  id: string;
  question: string;
  answer: AnswerValue;
  answerText: string;
}

export interface QuizSuccessResponse {
  ok: true;
  result: string;
  requestId: string;
  saved: boolean;
  profile: Profile | null;
}