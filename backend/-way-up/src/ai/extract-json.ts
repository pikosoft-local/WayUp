export function extractJson(raw: string): unknown {
  // Model może zwrócić JSON w kilku formatach, dlatego przygotowujemy kilka kandydatów.
  const candidates: string[] = [raw.trim()];

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1].trim());

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) candidates.push(raw.slice(start, end + 1));

  for (const candidate of candidates) {
    try {
      // Zwracamy pierwszy fragment, który faktycznie jest poprawnym JSON-em.
      return JSON.parse(candidate);
    } catch {
    }
  }
  return undefined;
}
