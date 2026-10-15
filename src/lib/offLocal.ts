/**
 * Mitgelieferte Markenprodukte aus Open Food Facts (1.2): rund 290'000 Produkte, die weltweit
 * am häufigsten gescannt werden, plus die beliebtesten jedes Landes. Scannen und Suchen gehen
 * damit sofort und offline; was fehlt, sucht die App weiter online.
 *
 * Erzeugt von `tools/build-off-products.mjs`, Format dort. Geladen wird erst beim ersten Scan
 * oder der ersten Produktsuche, dann bleibt alles im Speicher. Nicht in IndexedDB: Die Datei ist
 * unveränderlich, ein Kopieren wäre nur Zeit und doppelter Speicher.
 *
 * Daten: Open Food Facts, ODbL.
 */
import type { OffProduct } from './openfoodfacts';
import { matchScore, normalize } from './foodRank';

export interface LocalStore {
  lines: string[][];
  /** Barcode → Zeile; erst bei der ersten Barcode-Abfrage gebaut */
  byCode?: Map<string, number>;
  /** normalisierter Name + Marke; erst bei der ersten Suche gebaut */
  hay?: string[];
}

export function parseStore(text: string): LocalStore {
  const lines: string[][] = [];
  for (const line of text.split('\n')) {
    if (line) lines.push(line.split('\t'));
  }
  return { lines };
}

function toProduct(c: string[]): OffProduct {
  const serving = Number(c[7]);
  return {
    barcode: c[0],
    name: c[1],
    brand: c[2] || undefined,
    kcal_per_100g: Number(c[3]),
    protein_per_100g: Number(c[4]),
    fat_per_100g: Number(c[5]),
    carbs_per_100g: Number(c[6]),
    serving_g: c[7] && serving > 0 ? serving : undefined,
    is_liquid: c[8] === '1',
    incomplete: false,
  };
}

export function findInStore(store: LocalStore, barcode: string): OffProduct | undefined {
  if (!store.byCode) {
    store.byCode = new Map();
    store.lines.forEach((c, i) => {
      if (!store.byCode!.has(c[0])) store.byCode!.set(c[0], i);
    });
  }
  const code = barcode.replace(/\D/g, '');
  // EAN-13 mit führender 0 ist dasselbe Produkt wie der UPC-A ohne – Scanner liefern beides.
  const i = store.byCode.get(code) ?? store.byCode.get(code.replace(/^0+/, '')) ?? store.byCode.get(code.padStart(13, '0'));
  return i === undefined ? undefined : toProduct(store.lines[i]);
}

/**
 * Alle Begriffe müssen vorkommen, wie in der eigenen Datenbank. Bei gleicher Trefferqualität
 * gewinnt das beliebtere Produkt – die Datei ist danach sortiert.
 */
export function searchStore(store: LocalStore, query: string, limit = 20): OffProduct[] {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  if (!store.hay) store.hay = store.lines.map((c) => normalize(`${c[1]} ${c[2]}`));
  const best: { i: number; score: number }[] = [];
  const hay = store.hay;
  for (let i = 0; i < hay.length; i++) {
    let score = 0;
    let ok = true;
    for (const term of terms) {
      const s = matchScore(hay[i], term);
      if (s === undefined) {
        ok = false;
        break;
      }
      score += s;
    }
    if (!ok) continue;
    if (best.length === limit && score >= best[limit - 1].score) continue;
    let at = best.length;
    while (at > 0 && best[at - 1].score > score) at--;
    best.splice(at, 0, { i, score });
    if (best.length > limit) best.pop();
  }
  return best.map((b) => toProduct(store.lines[b.i]));
}

let loading: Promise<LocalStore | undefined> | undefined;

/** Lädt die Datei einmal. Ohne Datei (z. B. Tests) gibt es einfach keine lokalen Treffer. */
export function loadLocalProducts(): Promise<LocalStore | undefined> {
  loading ??= (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/off-products.tsv.gz`);
      if (!res.ok) return undefined;
      const bytes = new Uint8Array(await res.arrayBuffer());
      // Manche Server entpacken selbst (Content-Encoding) – dann ist schon Text da.
      const gz = bytes[0] === 0x1f && bytes[1] === 0x8b;
      const text = gz
        ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
        : new TextDecoder().decode(bytes);
      return parseStore(text);
    } catch {
      loading = undefined; // beim nächsten Mal erneut versuchen
      return undefined;
    }
  })();
  return loading;
}

export async function findLocalProduct(barcode: string): Promise<OffProduct | undefined> {
  const store = await loadLocalProducts();
  return store ? findInStore(store, barcode) : undefined;
}

export async function searchLocalProducts(query: string, limit = 20): Promise<OffProduct[]> {
  const store = await loadLocalProducts();
  return store ? searchStore(store, query, limit) : [];
}

/**
 * Beim Öffnen des Eintragen-Dialogs: Datei laden und die Verzeichnisse bauen, bevor jemand
 * tippt oder scannt. Auf dem iPhone dauert das beim ersten Mal rund eine Sekunde.
 */
export function warmLocalProducts(): void {
  void loadLocalProducts().then((store) => {
    if (!store) return;
    findInStore(store, '0');
    searchStore(store, 'a', 1);
  });
}
