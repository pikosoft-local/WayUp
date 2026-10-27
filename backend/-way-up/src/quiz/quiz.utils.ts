import { QUESTIONS } from './quiz.constants';
import { QuizAnswers } from './quiz.types';

export function formatAnswers(answers: QuizAnswers): string {
  return Object.entries(answers)
    .map(([key, value]) => {
      const label = QUESTIONS[key] ?? key;
      const text = Array.isArray(value) ? value.join(', ') : value;
      return `- ${label}: ${text}`;
    })
    .join('\n');
}

export function countSentences(text: string): number {
  return (text.match(/[.!?]+(\s|$)/g) || []).length;
}

export function countFilledAnswers(answers: QuizAnswers): number {
  return Object.values(answers).filter((value) =>
    Array.isArray(value) ? value.length > 0 : value.trim() !== '',
  ).length;
}