export type AnswerValue = string | string[];

export type QuizAnswers = Record<string, AnswerValue>;

export interface QuizSuccessResponse {
  ok: true;
  result: string;
  requestId: string;
}

export interface QuizErrorResponse {
  ok: false;
  error: string;
}