import { Question, QuestionBlock } from './questions.types';

export const QUESTIONS_VERSION = 1;
export const MAX_FOLLOW_UPS = 3;
export const SLIDER_MIN = 0;
export const SLIDER_MAX = 100;

export const BLOCKS: QuestionBlock[] = [
  { id: 1, title: 'Na start' },
  { id: 2, title: 'Twoja energia' },
  { id: 3, title: 'Szkoła i styl pracy' },
  { id: 4, title: 'Pasje i plany' },
];

export const QUESTION_BANK: Question[] = [
  {
    id: '0',
    block: 1,
    type: 'choice',
    label: 'Etap edukacji',
    text: 'Na jakim etapie edukacji jesteś?',
    options: [
      { id: 'podstawowka', label: 'Szkoła podstawowa' },
      { id: 'liceum', label: 'Liceum' },
      { id: 'technikum', label: 'Technikum / szkoła branżowa' },
      { id: 'studia', label: 'Studia' },
      { id: 'pracuje', label: 'Pracuję' },
      { id: 'inne', label: 'Coś innego' },
    ],
  },
  {
    id: '1',
    block: 1,
    type: 'text',
    label: 'Gry z dzieciństwa',
    text: 'W jakie gry grało Ci się najlepiej w dzieciństwie?',
  },
  {
    id: '2',
    block: 1,
    type: 'slider',
    label: 'Ludzie czy samodzielna praca',
    text: 'Wolisz pracować z ludźmi czy samodzielnie?',
    minLabel: 'Z ludźmi',
    maxLabel: 'Samodzielnie',
  },
  {
    id: '3',
    block: 1,
    type: 'choice',
    label: 'Morze czy góry',
    text: 'Morze czy góry?',
    options: [
      { id: 'morze', label: 'Morze' },
      { id: 'gory', label: 'Góry' },
      { id: 'oba', label: 'Oba' },
    ],
  },
  {
    id: '4',
    block: 1,
    type: 'slider',
    label: 'Miasto czy natura',
    text: 'Miasto czy natura?',
    minLabel: 'Miasto',
    maxLabel: 'Natura',
  },

];

export const QUESTIONS_BY_ID: Map<string, Question> = new Map(
  QUESTION_BANK.map((question) => [question.id, question]),
);