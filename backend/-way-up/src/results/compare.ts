import { Profile, TRAIT_KEYS, TRAIT_LABELS, TraitKey } from '../profile/profile.schema';

export interface TraitComparison {
  key: TraitKey;
  label: string;
  me: number;
  friend: number;
  diff: number;
}

export interface Comparison {
  score: number;
  level: 'high' | 'medium' | 'low';
  traits: TraitComparison[];
  mostSimilar: { key: TraitKey; label: string };
  mostDifferent: { key: TraitKey; label: string };
}

const value = (profile: Profile, key: TraitKey) =>
  profile.traits.find((t) => t.key === key)?.value ?? 50;

export function compareProfiles(mine: Profile, friend: Profile): Comparison {
  const traits: TraitComparison[] = TRAIT_KEYS.map((key) => {
    const me = value(mine, key);
    const fr = value(friend, key);
    return { key, label: TRAIT_LABELS[key], me, friend: fr, diff: Math.abs(me - fr) };
  });

  const averageDiff = traits.reduce((sum, t) => sum + t.diff, 0) / traits.length;
  const score = Math.round(100 - averageDiff);

  const byDiff = [...traits].sort((a, b) => a.diff - b.diff);
  const pick = ({ key, label }: TraitComparison) => ({ key, label });

  return {
    score,
    level: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
    traits,
    mostSimilar: pick(byDiff[0]),
    mostDifferent: pick(byDiff[byDiff.length - 1]),
  };
}
