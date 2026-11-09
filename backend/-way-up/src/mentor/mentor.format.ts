// Funkcje przygotowujące odpowiedzi quizu do kontekstu mentora AI.
import type { StoredAnswer } from '../quiz/quiz.types';

export function formatStoredAnswers(answers: StoredAnswer[]): string {
  return answers
    .filter((a) => a.answerText.trim() !== '')
    .map((a) => `- ${a.question}: ${a.answerText}`)
    .join('\n');
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[ \t]{0,3}#{1,6}[ \t]*/gm, '')
    .replace(/^[ \t]{0,3}>[ \t]?/gm, '')
    .replace(/^[ \t]*[*•][ \t]+/gm, '- ')
    .replace(/(\*\*|__)(.+?)\1/gs, '$2')
    .replace(/~~(.+?)~~/gs, '$1')
    .replace(/\*+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const ENGLISH_WORDS = new Set([
  'the', 'and', 'are', 'you', 'your', 'of', 'that', 'it', 'for', 'with', 'this', 'be',
  'can', 'will', 'have', 'what', 'how', 'about', 'or', 'we', 'is', 'in', 'my', 'if',
]);

export function looksEnglish(text: string): boolean {
  const words = text.toLowerCase().match(/[a-ząćęłńóśźż']+/g) ?? [];
  if (words.length < 6) return false;
  const hits = words.filter((w) => ENGLISH_WORDS.has(w)).length;
  return hits / words.length > 0.15;
}