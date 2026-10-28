import type { Profile } from '../profile/profile.schema';

export type AnswerValue = string | string[];

export type QuizAnswers = Record<string, AnswerValue>;

export interface FollowUpAnswer {
  question: string;
  answer: AnswerValue;
}

export interface QuizSubmission {
  answers: QuizAnswers;
  followUps: FollowUpAnswer[];
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
<<<<<<< HEAD
  saved: boolean;
  profile: Profile | null;
=======
  saved: true;
}

export interface QuizResultRecord {
  id: string;
  answers: Array<{
    id: string;
    question: string;
    answer: AnswerValue;
  }>;
  result: string;
  created_at: string;
}

export interface QuizErrorResponse {
  ok: false;
  error: string;
>>>>>>> 5efc24a14b9399c26500a4880e932096c26f1ef8
}