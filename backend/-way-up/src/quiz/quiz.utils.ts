import { QUESTIONS_BY_ID, SLIDER_MAX, SLIDER_MIN } from '../questions/questions.data';
import { Question } from '../questions/questions.types';
import { AnswerValue, QuizAnswers, QuizSubmission, StoredAnswer } from './quiz.types';

export function answerParts(value: AnswerValue): string[] {
  return (Array.isArray(value) ? value : [value]).map((v) => v.trim()).filter((v) => v !== '');
}

export function isFilled(value: AnswerValue): boolean {
  return answerParts(value).length > 0;
}

export function countFilledAnswers(answers: QuizAnswers): number {
  return Object.values(answers).filter(isFilled).length;
}

export function describeAnswer(question: Question | undefined, value: AnswerValue): string {
  const parts = answerParts(value);

  if (question?.type === 'slider' && parts.length === 1 && /^-?\d+(\.\d+)?$/.test(parts[0])) {
    const n = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Math.round(Number(parts[0]))));
    return `${n}/100 (0 = ${question.minLabel}, 100 = ${question.maxLabel})`;
  }

  if (question?.options) {
    const labels = new Map(question.options.map((o) => [o.id, o.label]));
    return parts.map((p) => labels.get(p) ?? p).join(', ');
  }

  return parts.join(', ');
}

export function formatSubmission({ answers, followUps, questions }: QuizSubmission): string {
  const lines: string[] = [];
  const lookup = questions ?? QUESTIONS_BY_ID;

  for (const [id, value] of Object.entries(answers)) {
    if (!isFilled(value)) continue;
    const question = lookup.get(id);
    lines.push(`- ${question?.label ?? id}: ${describeAnswer(question, value)}`);
  }

  for (const followUp of followUps) {
    if (!isFilled(followUp.answer)) continue;
    lines.push(`- ${followUp.question}: ${describeAnswer(undefined, followUp.answer)}`);
  }

  return lines.join('\n');
}

export function toStoredAnswers({ answers, followUps, questions }: QuizSubmission): StoredAnswer[] {
  const lookup = questions ?? QUESTIONS_BY_ID;
  const stored: StoredAnswer[] = Object.entries(answers).map(([id, answer]) => {
    const question = lookup.get(id);
    return {
      id,
      question: question?.label ?? id,
      answer,
      answerText: describeAnswer(question, answer),
    };
  });

  followUps.forEach((followUp, index) => {
    stored.push({
      id: `f${index + 1}`,
      question: followUp.question,
      answer: followUp.answer,
      answerText: describeAnswer(undefined, followUp.answer),
    });
  });

  return stored;
}

export function countSentences(text: string): number {
  return (text.match(/[.!?]+(\s|$)/g) || []).length;
}