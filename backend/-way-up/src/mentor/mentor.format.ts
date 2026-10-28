import type { StoredAnswer } from '../quiz/quiz.types';

export function formatStoredAnswers(answers: StoredAnswer[]): string {
  return answers
    .filter((a) => a.answerText.trim() !== '')
    .map((a) => `- ${a.question}: ${a.answerText}`)
    .join('\n');
}
