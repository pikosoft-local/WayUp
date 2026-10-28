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
    label: 'Ludzie czy komputery',
    text: 'Wolisz pracować z ludźmi czy z komputerami?',
    minLabel: 'Ludzie',
    maxLabel: 'Komputery',
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

  {
    id: '5',
    block: 2,
    type: 'multi',
    label: 'Co robi w wolnym czasie',
    text: 'Co robisz w wolnym czasie? (możesz wybrać kilka)',
    options: [
      { id: 'gry', label: 'Gram w gry' },
      { id: 'sport', label: 'Uprawiam sport' },
      { id: 'czytanie', label: 'Czytam' },
      { id: 'wideo', label: 'Oglądam filmy, seriale, YouTube' },
      { id: 'tworzenie', label: 'Tworzę (rysuję, muzyka, kodowanie…)' },
      { id: 'znajomi', label: 'Spotykam się ze znajomymi' },
      { id: 'majsterkowanie', label: 'Majsterkuję, składam rzeczy' },
      { id: 'inne', label: 'Coś innego' },
    ],
  },
  {
    id: '6',
    block: 2,
    type: 'text',
    label: 'Co potrafi robić godzinami',
    text: 'Co potrafisz robić godzinami?',
  },
  {
    id: '7',
    block: 2,
    type: 'slider',
    label: 'Jak szybko się nudzi',
    text: 'Jak szybko się nudzisz?',
    minLabel: 'Nudzę się szybko',
    maxLabel: 'Mogę godzinami',
  },
  {
    id: '8',
    block: 2,
    type: 'slider',
    label: 'Tworzyć czy analizować',
    text: 'Wolisz tworzyć czy analizować?',
    minLabel: 'Tworzyć',
    maxLabel: 'Analizować',
  },
  {
    id: '9',
    block: 2,
    type: 'choice',
    label: 'Działać czy planować',
    text: 'Dostajesz projekt do oddania za tydzień. Co robisz najpierw?',
    options: [
      { id: 'dzialam', label: 'Od razu zaczynam coś robić i poprawiam po drodze' },
      { id: 'planuje', label: 'Rozpisuję plan i etapy' },
      { id: 'ekipa', label: 'Zbieram ekipę i dzielimy zadania' },
      { id: 'research', label: 'Sprawdzam, jak robili to inni' },
    ],
  },

  {
    id: '10',
    block: 3,
    type: 'slider',
    label: 'Rywalizacja czy współpraca',
    text: 'Wolisz rywalizację czy współpracę?',
    minLabel: 'Rywalizacja',
    maxLabel: 'Współpraca',
  },
  {
    id: '11',
    block: 3,
    type: 'text',
    label: 'Ulubiony przedmiot',
    text: 'Jaki jest Twój ulubiony przedmiot w szkole?',
  },
  {
    id: '12',
    block: 3,
    type: 'text',
    label: 'Przedmiot, którego unika',
    text: 'Którego przedmiotu unikasz?',
  },
  {
    id: '13',
    block: 3,
    type: 'text',
    label: 'Co chciałby umieć',
    text: 'Czego chciałbyś / chciałabyś się nauczyć?',
  },
  {
    id: '14',
    block: 3,
    type: 'choice',
    label: 'Gdzie chciałby pracować',
    text: 'Gdzie chcesz pracować?',
    options: [
      { id: 'korporacja', label: 'W dużej firmie' },
      { id: 'startup', label: 'W startupie' },
      { id: 'wlasna', label: 'Na własny rachunek' },
      { id: 'zdalnie', label: 'Zdalnie, z domu' },
      { id: 'publiczne', label: 'W instytucji publicznej lub organizacji' },
      { id: 'teren', label: 'W terenie, w ruchu' },
    ],
  },

  {
    id: '15',
    block: 4,
    type: 'text',
    label: 'Zawód, który go ciekawi',
    text: 'Jaki zawód Cię ciekawi?',
  },
  {
    id: '16',
    block: 4,
    type: 'text',
    label: 'Gra, która go opisuje',
    text: 'Jaka gra najlepiej Cię opisuje?',
  },
  {
    id: '17',
    block: 4,
    type: 'text',
    label: 'Pomysł na własną firmę',
    text: 'Masz pomysł na własną firmę? Jaki?',
  },
  {
    id: '18',
    block: 4,
    type: 'text',
    label: 'Co najczęściej googluje',
    text: 'Co najczęściej wyszukujesz w Google?',
  },
  {
    id: '19',
    block: 4,
    type: 'text',
    label: 'Kanał na YouTube, który ogląda',
    text: 'Jaki kanał na YouTube oglądasz najczęściej?',
  },
];

export const QUESTIONS_BY_ID: ReadonlyMap<string, Question> = new Map(
  QUESTION_BANK.map((question) => [question.id, question]),
);
