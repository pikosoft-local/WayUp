import { z } from 'zod';

export const TRAIT_KEYS = [
  'creativity',
  'analytical',
  'stress_resilience',
  'leadership',
  'empathy',
  'independence',
] as const;
export type TraitKey = (typeof TRAIT_KEYS)[number];

export const TRAIT_LABELS: Record<TraitKey, string> = {
  creativity: 'Kreatywność',
  analytical: 'Myślenie analityczne',
  stress_resilience: 'Odporność na stres',
  leadership: 'Przywództwo',
  empathy: 'Empatia',
  independence: 'Samodzielność',
};

export const PATH_TYPES = ['safe', 'surprising', 'future'] as const;
export type PathType = (typeof PATH_TYPES)[number];

export const PROFILE_DISCLAIMER =
  'Widełki zarobkowe, perspektywy i ryzyko automatyzacji to szacunki wygenerowane przez AI, a nie dane z rynku.';

const str = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((s) => (s.length > max ? s.slice(0, max).trimEnd() : s));

const list = <T extends z.ZodType>(item: T, min: number, max: number) =>
  z
    .array(item)
    .min(min)
    .transform((items) => items.slice(0, max));

const steps = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? [v] : v),
    z
      .array(str(220))
      .min(1)
      .transform((items) => items.slice(0, max)),
  );

const score = z.coerce.number().transform((v) => Math.min(100, Math.max(0, Math.round(v))));

const traitsSchema = z
  .array(z.object({ key: z.enum(TRAIT_KEYS), value: score }))
  .refine((traits) => TRAIT_KEYS.every((key) => traits.some((t) => t.key === key)), {
    message: 'Brakuje którejś z cech',
  })
  .transform((traits) =>
    TRAIT_KEYS.map((key) => ({
      key,
      label: TRAIT_LABELS[key],
      value: traits.find((t) => t.key === key)!.value,
    })),
  );

const pathSchema = z.object({
  type: z.enum(PATH_TYPES),
  title: str(80),
  description: str(450),
  whyFit: str(450),
  salaryPln: z
    .object({ min: z.coerce.number().nonnegative(), max: z.coerce.number().nonnegative() })
    .transform(({ min, max }) => (min <= max ? { min, max } : { min: max, max: min })),
  outlook: str(350),
  automationRisk: z.enum(['low', 'medium', 'high']),
});

const pathsSchema = z
  .array(pathSchema)
  .length(3)
  .refine((paths) => PATH_TYPES.every((type) => paths.some((p) => p.type === type)), {
    message: 'Wymagane są dokładnie ścieżki: safe, surprising, future',
  })
  .transform((paths) => PATH_TYPES.map((type) => paths.find((p) => p.type === type)!));

export const profileSchema = z.object({
  archetype: z.object({ name: str(60), tagline: str(200) }),
  traits: traitsSchema,
  explanation: str(1000),
  paths: pathsSchema,
  skills: z.object({
    hard: list(str(80), 3, 6),
    soft: list(str(80), 3, 6),
  }),
  roadmap: z.object({
    forPath: z.enum(PATH_TYPES),
    months3: steps(4),
    months6: steps(4),
    months12: steps(4),
  }),
  learningAreas: list(z.object({ area: str(100), why: str(250) }), 3, 5),
});

export type Profile = z.output<typeof profileSchema> & { disclaimer: string };