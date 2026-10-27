export type AnswerValue = string | string[];

export type QuizAnswers = Record<string, AnswerValue>;

export interface QuizSuccessResponse {
  ok: true;
  result: string;
  requestId: string;
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
}