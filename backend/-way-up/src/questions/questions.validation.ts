import { QuestionType } from './questions.types';

export interface NormalizedQuestion {
  type: QuestionType;
  text: string;
  label?: string;
  options?: string[];
  minLabel?: string;
  maxLabel?: string;
}

export type NormalizeResult = { ok: true; question: NormalizedQuestion } | { ok: false; reason: string };

const ESCAPE_CHOICE = 'Żadna z tych';
const ESCAPE_MULTI = 'Żadne z tych';
const ESCAPE_PATTERN =
  /^(żadn[aeyo]( z (tych|powyższych))?|inn[aey]|zależy( od sytuacji)?|trudno powiedzieć|nie wiem|wszystkie powyższe)\.?$/i;
const SLIDER_BANNED = /(skal[aięey]|suwak|przesu[ńn]|oce[ńn]|procent|%|\d)/i;
const LABEL_BANNED = /[<>\/\d%]/;
const FILLER_OPTIONS = /^(wszystkie powyższe|tak|nie)\.?$/i;

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const clean = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
}

export function isTooSimilar(a: string, b: string, threshold = 0.5): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  let common = 0;
  for (const w of ta) if (tb.has(w)) common++;
  return common / (ta.size + tb.size - common) >= threshold;
}

export function normalizeQuestion(raw: any, expectedType?: QuestionType): NormalizeResult {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'to nie jest obiekt JSON' };

  const type = raw.type as QuestionType;
  if (!['text', 'choice', 'multi', 'slider'].includes(type)) {
    return { ok: false, reason: `nieznany typ "${raw.type}"` };
  }
  if (expectedType && type !== expectedType) {
    return { ok: false, reason: `typ musi być "${expectedType}", a jest "${type}"` };
  }

  let text = clean(raw.text);
  if (text.length < 12 || text.length > 200) return { ok: false, reason: 'treść pytania musi mieć 12-200 znaków' };
  if (wordCount(text) > 28) return { ok: false, reason: 'pytanie jest za długie (max ok. 20 słów)' };
  if (!text.endsWith('?') && !(type === 'multi' && /[.!]$/.test(text)) && type !== 'text') {
    text = `${text.replace(/[.!:]+$/, '')}?`;
  }
  if (type === 'text' && !/[?.]$/.test(text)) text += '?';
  if ((text.match(/\?/g) ?? []).length > 1) {
    return { ok: false, reason: 'to więcej niż jedno pytanie – zadaj tylko jedno' };
  }
  if (/[a-z]{3,}\s+(or|and|the)\s+[a-z]{3,}/i.test(text)) return { ok: false, reason: 'tekst zawiera angielski' };

  const label = clean(raw.label) || undefined;

  if (type === 'text') return { ok: true, question: { type, text, label } };

  if (type === 'choice' || type === 'multi') {
    const rawOptions: unknown[] = Array.isArray(raw.options) ? raw.options : [];
    const seen = new Set<string>();
    const options: string[] = [];
    for (const o of rawOptions) {
      const label = clean(typeof o === 'object' && o !== null ? (o as any).label : o);
      if (!label || label.length > 60) continue;
      if (ESCAPE_PATTERN.test(label) || FILLER_OPTIONS.test(label)) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      options.push(label);
    }
    if (options.length < 3) return { ok: false, reason: 'za mało różnych, sensownych opcji (potrzeba min. 4 + wyjście awaryjne)' };

    if (options.some((o, i) => options.some((p, j) => i !== j && isTooSimilar(o, p, 0.8)))) {
      return { ok: false, reason: 'opcje są prawie takie same' };
    }

    const body = options.slice(0, type === 'choice' ? 4 : 4);
    const finalOptions = [...body, type === 'choice' ? ESCAPE_CHOICE : ESCAPE_MULTI];

    if (type === 'multi' && !/(wybierz|zaznacz)/i.test(text)) {
      text = `${text.replace(/\?$/, '?')} Wybierz wszystko, co pasuje.`;
    }
    return { ok: true, question: { type, text, label, options: finalOptions } };
  }

  if (SLIDER_BANNED.test(text)) return { ok: false, reason: 'pytanie suwaka nie może zawierać słów "skala", "oceń", liczb itp.' };
  if (/^(czy|czy\s)/i.test(text) && !/jak bardzo/i.test(text)) {
    return { ok: false, reason: 'pytanie suwaka nie może być pytaniem tak/nie (użyj "Jak bardzo…" lub dylematu)' };
  }
  const minLabel = clean(raw.minLabel);
  const maxLabel = clean(raw.maxLabel);
  if (!minLabel || !maxLabel) return { ok: false, reason: 'suwak wymaga minLabel i maxLabel' };
  if (minLabel.toLowerCase() === maxLabel.toLowerCase()) return { ok: false, reason: 'etykiety suwaka są takie same' };
  for (const l of [minLabel, maxLabel]) {
    if (wordCount(l) > 5 || l.length > 40) return { ok: false, reason: 'etykiety suwaka max 1-4 słowa' };
    if (LABEL_BANNED.test(l)) return { ok: false, reason: 'etykiety suwaka bez cyfr i znaków < > / %' };
  }
  return { ok: true, question: { type, text, label, minLabel, maxLabel } };
}