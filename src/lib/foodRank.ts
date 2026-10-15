/**
 * Reihenfolge der Treffer in der eigenen Datenbank. Mit gut sechstausend Grundnahrungsmitteln
 * reicht Filtern nicht mehr: Wer „hafer" tippt, will „Hafer Flocken" oben sehen und nicht
 * „Schweinefleisch mit Haferbeilage". Gewichtet wird in dieser Reihenfolge:
 *
 *   1. genauer Namenstreffer
 *   2. Treffer an einer Wortgrenze vor Treffern mitten im Wort („Heidelbeeren" für „ei")
 *   3. Favorit
 *   4. wie oft schon benutzt
 *   5. Trefferqualität (ganzes Wort, Wortende, Wortanfang; früh schlägt spät)
 *   6. kurzer Name, dann alphabetisch
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
 *
 *                          im ersten Wort   in einem späteren Wort
 *   ganzes Wort            0                160 + Position   („Ei (ganz)" / „Tiramisu (ohne Ei)")
 *   Wortende               20 + Position    170 + Position   („Hühnerei" / „Bio Hühnerei"),
 *                                                            nur mit mindestens 3 Buchstaben davor
 *   Wortanfang             100 + Position   250 + Position   („Eiswein" / „Rotwein Eiswein")
 *   Wortmitte              400 + Position                    („Heidelbeeren")
 *
 * Das erste Wort sagt, was ein Lebensmittel ist; spätere Wörter beschreiben es. Und im Deutschen
 * steht das eigentliche Lebensmittel am Ende des zusammengesetzten Wortes: Hühnerei ist ein Ei,
 * Eiswein ist Wein. Darum schlägt das Wortende den Wortanfang.
 */
export function matchScore(haystack: string, term: string): number | undefined {
  const at = haystack.indexOf(term);
  if (at < 0) return undefined;
  const isWordChar = (c: string | undefined) => c !== undefined && /[a-z0-9]/.test(c);
  const starts = at === 0 || !isWordChar(haystack[at - 1]);
  const ends = !isWordChar(haystack[at + term.length]);
  const firstWord = !/[^a-z0-9]/.test(haystack.slice(0, at));
  // Wortende nur bei echten Zusammensetzungen: Hühner|ei, Rühr|ei, Basmati|reis – nicht Bl|ei, Br|ei.
  let wordStart = at;
  while (wordStart > 0 && isWordChar(haystack[wordStart - 1])) wordStart--;
  const compoundTail = ends && !starts && at - wordStart >= 3;
  const pos = Math.min(at, 60);
  if (starts && ends) return firstWord ? 0 : 160 + pos;
  if (compoundTail) return (firstWord ? 20 : 170) + pos;
  if (starts) return (firstWord ? 100 : 250) + pos;
  return 400 + pos;
}

/**
 * Amerikanisch gegen britisch. Die mitgelieferte Tabelle ist der deutsche
 * Bundeslebensmittelschlüssel in britischem Englisch: wer „zucchini" tippt, fand darin nichts,
 * weil sie dort „courgette" heisst. Jedes Paar gilt in beide Richtungen – die eigene Datenbank
 * eines Nutzers kann das jeweils andere Wort enthalten.
 *
 * Jeder Eintrag ist an `src/db/reference/en.json` gegengeprüft; geraten wird hier nichts.
 * Mehrdeutiges bleibt draussen: „chips" heisst auf beiden Seiten des Atlantiks etwas anderes,
 * und „soda" wäre mit Backsoda verwechselbar.
 */
const SYNONYMS: readonly (readonly [string, string])[] = [
  ['zucchini', 'courgette'],
  ['eggplant', 'aubergine'],
  ['ground', 'mince'],
  ['shrimp', 'prawn'],
  ['cilantro', 'coriander'],
  ['arugula', 'rocket'],
  ['rutabaga', 'swede'],
  ['scallion', 'spring onion'],
  ['green onion', 'spring onion'],
  ['beet', 'beetroot'],
  ['garbanzo', 'chickpea'],
  ['golden raisin', 'sultana'],
  ['whole wheat', 'wholemeal'],
  ['cornstarch', 'maize starch'],
  ['corn starch', 'maize starch'],
  ['oatmeal', 'oat flakes'],
  ['heavy cream', 'whipping cream'],
  ['cookie', 'biscuit'],
  ['powdered sugar', 'icing sugar'],
  ['confectioners sugar', 'icing sugar'],
];

/** Ganze Wörter ersetzen, sonst wird aus „cornflakes" ein „maizeflakes". */
function swapWord(text: string, from: string, to: string): string {
  return text.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
}

/**
 * Die Suche und ihre Entsprechungen. „ground beef" wird zusätzlich als „mince beef" gesucht;
 * die ursprüngliche Eingabe bleibt immer dabei, es geht also nie ein Treffer verloren.
 */
export function queryVariants(q: string): string[] {
  const out = [q];
  for (const [us, uk] of SYNONYMS) {
    if (new RegExp(`\\b${us}\\b`).test(q)) out.push(swapWord(q, us, uk));
    else if (new RegExp(`\\b${uk}\\b`).test(q)) out.push(swapWord(q, uk, us));
  }
  return [...new Set(out)];
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
  const variants = queryVariants(q);
  const termSets = variants.map((v) => v.split(/\s+/));

  const scored: { food: T; exact: number; mid: number; score: number }[] = [];
  for (const food of foods) {
    const name = normalize(food.name);
    const hay = normalize(`${food.name} ${food.brand ?? ''}`);
    // Beste Bewertung über alle Schreibweisen: die Entsprechung darf die Eingabe nicht verdrängen.
    let best: number | undefined;
    for (const terms of termSets) {
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
      if (all && (best === undefined || score < best)) best = score;
    }
    if (best === undefined) continue;
    // Ein Begriff nur mitten im Wort: Zufallstreffer, auch bei Favoriten nach hinten.
    scored.push({ food, exact: variants.includes(name) ? 0 : 1, mid: best >= 400 ? 1 : 0, score: best + name.length / 100 });
  }

  scored.sort(
    (a, b) =>
      a.exact - b.exact ||
      a.mid - b.mid ||
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
