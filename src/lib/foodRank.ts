/**
 * Reihenfolge der Treffer in der eigenen Datenbank. Mit gut sechstausend Grundnahrungsmitteln
 * reicht Filtern nicht mehr: Wer „hafer" tippt, will „Hafer Flocken" oben sehen und nicht
 * „Schweinefleisch mit Haferbeilage". Gewichtet wird in dieser Reihenfolge:
 *
 *   1. genauer Namenstreffer
 *   2. Favorit
 *   3. wie oft schon benutzt
 *   4. Trefferqualität (Wortanfang schlägt Wortmitte, früh schlägt spät)
 *   5. kurzer Name, dann alphabetisch
 */
export interface RankableFood {
  id?: number;
  name: string;
  brand?: string;
  favorite?: 0 | 1;
}

export function normalize(s: string): string {
  return s.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Trefferqualität eines Suchbegriffs im Text; kleiner ist besser.
 * `undefined` heisst: kommt nicht vor.
 */
export function matchScore(haystack: string, term: string): number | undefined {
  const at = haystack.indexOf(term);
  if (at < 0) return undefined;
  if (at === 0) return 0;
  const wordStart = /[\s,.\-/(]/.test(haystack[at - 1]);
  return (wordStart ? 100 : 400) + Math.min(at, 60);
}

export function rankFoods<T extends RankableFood>(
  foods: readonly T[],
  query: string,
  usage?: Map<number, { count: number }>,
): T[] {
  const q = normalize(query.trim());
  if (!q) {
    return [...foods].sort((a, b) => byFavorite(a, b) || byUsage(a, b, usage) || a.name.localeCompare(b.name));
  }
  const terms = q.split(/\s+/);

  const scored: { food: T; exact: number; score: number }[] = [];
  for (const food of foods) {
    const name = normalize(food.name);
    const hay = normalize(`${food.name} ${food.brand ?? ''}`);
    let score = 0;
    let all = true;
    for (const term of terms) {
      const s = matchScore(hay, term);
      if (s === undefined) {
        all = false;
        break;
      }
      score += s;
    }
    if (!all) continue;
    scored.push({ food, exact: name === q ? 0 : 1, score: score + name.length / 100 });
  }

  scored.sort(
    (a, b) =>
      a.exact - b.exact ||
      byFavorite(a.food, b.food) ||
      byUsage(a.food, b.food, usage) ||
      a.score - b.score ||
      a.food.name.localeCompare(b.food.name),
  );
  return scored.map((s) => s.food);
}

function byFavorite(a: RankableFood, b: RankableFood): number {
  return (b.favorite ?? 0) - (a.favorite ?? 0);
}

function byUsage(a: RankableFood, b: RankableFood, usage?: Map<number, { count: number }>): number {
  const ua = (a.id !== undefined && usage?.get(a.id)?.count) || 0;
  const ub = (b.id !== undefined && usage?.get(b.id)?.count) || 0;
  return ub - ua;
}
