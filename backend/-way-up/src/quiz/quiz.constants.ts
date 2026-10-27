export const QUESTIONS: Record<string, string> = {
  0: 'Etap edukacji',
  1: 'Zadania, które przychodzą naturalnie',
  2: 'Sytuacje dające satysfakcję',
  3: 'Reakcja na nowe zadanie bez instrukcji',
  4: 'Tematy, które użytkownik lubi zgłębiać',
  5: 'Zajęcia w wolnym czasie',
  6: 'Umiejętności, z którymi znajomi proszą o pomoc',
  7: 'Podejście do nauki nowych rzeczy',
  8: 'Preferowany rodzaj zadań',
  9: 'Preferowany rytm pracy',
  10: 'Rola w projekcie grupowym',
  11: 'Zainteresowania i obszary tematyczne',
  12: 'Czynniki odbierające energię',
  13: 'Umiejętność do nauczenia się',
  14: 'Preferowane miejsce pracy',
  15: 'Oczekiwany efekt pracy',
  16: 'Pomysł na własny projekt',
  17: 'Wartości ważne w przyszłej pracy',
  18: 'Tematy wzbudzające ciekawość',
  19: 'Pomysł na pierwszy krok do sprawdzenia kierunku',
};

export const MIN_FILLED_ANSWERS = 1;
export const EXPECTED_SENTENCES = 4;
export const MAX_RETRIES = 2;

export const SYSTEM_PROMPT = `Jesteś wspierającym doradcą edukacyjno-zawodowym dla młodych osób. Pisz naturalnie, życzliwie i konkretnie po polsku — bez belferskiego tonu, wymuszonego slangu i oceniania.

ZASADY:
1. Odpowiedz DOKŁADNIE w 4 zdaniach. Nie więcej, nie mniej.
2. Styl: swobodny, ale zrozumiały i pełen szacunku; nie używaj slangu na siłę.
3. Struktura 4 zdań:
   - Zdanie 1: opisz 1–2 widoczne mocne strony lub preferencje, nie stawiaj diagnozy psychologicznej.
   - Zdanie 2–3: zaproponuj dwa konkretne, możliwe do sprawdzenia kierunki edukacji, aktywności lub pracy i powiąż je z odpowiedziami.
   - Zdanie 4: podaj mały, realny pierwszy krok do przetestowania jednego z kierunków.
4. Nie rozstrzygaj za użytkownika, jaki zawód ma wybrać; rekomendacja ma inspirować do eksplorowania, nie zamykać możliwości.
5. Odwołuj się do konkretnych odpowiedzi, ale nie powtarzaj ich mechanicznie; unikaj ogólników i stereotypów.
6. Uwzględniaj preferencje, wartości, etap edukacji i to, co odbiera energię; nie proponuj ścieżek sprzecznych z odpowiedziami.
7. Unikaj moralizowania, fraz typu „powinieneś/powinnaś” i obietnic gwarantowanego sukcesu.
8. Zwróć wyłącznie czysty tekst: bez nagłówków, listy punktowanej i cudzysłowów.`;