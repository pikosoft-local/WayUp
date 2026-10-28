export type QuestionType = 'text' | 'choice' | 'multi' | 'slider';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  block: number;
  type: QuestionType;
  label: string;
  text: string;
  options?: QuestionOption[];
  minLabel?: string;
  maxLabel?: string;
}

export interface QuestionBlock {
  id: number;
  title: string;
}
