// Funkcje zapisu i odczytu niedokończonego quizu w pamięci przeglądarki.
export const BASE_QUESTION_COUNT = 5;

export const DRAFT_MAX_AGE_MS = 20 * 60 * 60 * 1000;

export const DRAFT_KEY_PREFIX = "wayup.quizDraft.";

// Tworzymy osobny klucz dla każdego użytkownika, żeby konta nie dzieliły szkicu.
export function draftStorageKey(userId) {
  return `${DRAFT_KEY_PREFIX}${userId}`;
}

// Zwracamy pusty szkic, gdy użytkownik jeszcze nic nie zapisał.
function emptyDraft() {
  return { answers: {}, page: 0, followUps: [], questionSet: null };
}

// Sprawdzamy, czy zapisany zestaw pytań ma poprawny format i nie jest za stary.
function parseQuestionSet(raw, now) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.questions) || raw.questions.length === 0) {
    return null;
  }
  const valid = raw.questions.every(
    (question) =>
      question &&
      typeof question.id === "string" &&
      typeof question.type === "string" &&
      typeof question.text === "string",
  );
  if (!valid) return null;
  if (!Number.isFinite(raw.savedAt) || now - raw.savedAt > DRAFT_MAX_AGE_MS) return null;
  return {
    questions: raw.questions,
    token: typeof raw.token === "string" ? raw.token : null,
    savedAt: raw.savedAt,
  };
}

// Odczytujemy szkic z sessionStorage i naprawiamy brakujące lub błędne wartości.
export function readDraft(userId, now = Date.now()) {
  if (!userId) return emptyDraft();

  try {
    const savedDraft = sessionStorage.getItem(draftStorageKey(userId));
    if (!savedDraft) return emptyDraft();
    const draft = JSON.parse(savedDraft);

    const answers =
      draft.answers && typeof draft.answers === "object" && !Array.isArray(draft.answers)
        ? draft.answers
        : {};
    const page = Number.isInteger(draft.page) && draft.page >= 0 ? draft.page : 0;
    const followUps = Array.isArray(draft.followUps) ? draft.followUps.slice(0, 3) : [];
    const questionSet = parseQuestionSet(draft.questionSet, now);

    if (!questionSet) {
      const baseAnswers = Object.fromEntries(
        Object.entries(answers).filter(([id]) => Number(id) < BASE_QUESTION_COUNT),
      );
      return {
        answers: baseAnswers,
        page: Math.min(page, BASE_QUESTION_COUNT - 1),
        followUps,
        questionSet: null,
      };
    }

    return { answers, page, followUps, questionSet };
  } catch {
    return {
      ...emptyDraft(),
      error: "Nie udało się odczytać szkicu quizu z tej przeglądarki.",
    };
  }
}

// Zapisujemy aktualny zestaw pytań, aby można było bezpiecznie wrócić do quizu.
export function saveQuestionSet(userId, questionSet) {
  try {
    const stored = readDraft(userId);
    sessionStorage.setItem(
      draftStorageKey(userId),
      JSON.stringify({
        answers: stored.answers,
        page: stored.page,
        followUps: stored.followUps,
        questionSet,
      }),
    );
  } catch {
  }
}