import type { FoodItem } from '../db/types';

const APP_NAME = 'LucaNutritionTracker';
const APP_VERSION = '0.1';

/** Nur die Felder anfordern, die wir wirklich brauchen (kleinere Antwort). */
const FIELDS = [
  'code',
  'product_name',
  'product_name_de',
  'brands',
  'quantity',
  'serving_quantity',
  'nutriments',
].join(',');

export interface OffProduct {
  barcode: string;
  name: string;
  brand?: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  /** Portionsgrösse in g laut Verpackung, falls vorhanden */
  serving_g?: number;
  /** Ob die Nährwerte pro 100 ml (statt 100 g) gelten */
  is_liquid: boolean;
  /** true, wenn kcal/Makros unvollständig waren */
  incomplete: boolean;
}

export type OffResult =
  | { status: 'found'; product: OffProduct }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

/**
 * Fragt ein Produkt bei Open Food Facts ab.
 * Hinweis: Browser erlauben keinen eigenen User-Agent-Header; stattdessen
 * werden app_name/app_version als Query-Parameter mitgeschickt, wie von OFF
 * für Web-Apps vorgesehen.
 */
export async function lookupBarcode(barcode: string): Promise<OffResult> {
  const code = barcode.replace(/\D/g, '');
  if (!code) return { status: 'error', message: 'Ungültiger Barcode.' };

  const url = new URL(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('app_name', APP_NAME);
  url.searchParams.set('app_version', APP_VERSION);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') {
      return { status: 'error', message: 'Open Food Facts antwortet nicht (Zeitüberschreitung).' };
    }
    return { status: 'error', message: 'Keine Verbindung zu Open Food Facts.' };
  }

  if (res.status === 404) return { status: 'not_found' };
  if (res.status === 429) return { status: 'error', message: 'Zu viele Anfragen – kurz warten.' };
  if (!res.ok) return { status: 'error', message: `Open Food Facts antwortet mit ${res.status}.` };

  const json = await res.json();
  if (json.status === 0 || !json.product) return { status: 'not_found' };
  // Leere Hülle ohne Name und Nährwerte ist für uns wertlos.
  const p = json.product;
  if (!p.product_name && !p.product_name_de && !p.nutriments) return { status: 'not_found' };

  return { status: 'found', product: parseProduct(code, p) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProduct(code: string, p: any): OffProduct {
  const n = p.nutriments ?? {};
  const num = (v: unknown): number | undefined => {
    const x = typeof v === 'string' ? Number(v) : v;
    return typeof x === 'number' && Number.isFinite(x) ? x : undefined;
  };

  // kcal bevorzugt, sonst aus kJ umrechnen
  let kcal = num(n['energy-kcal_100g']);
  if (kcal === undefined) {
    const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']);
    if (kj !== undefined) kcal = kj / 4.184;
  }
  const protein = num(n.proteins_100g);
  const fat = num(n.fat_100g);
  const carbs = num(n.carbohydrates_100g);

  const quantity: string = p.quantity ?? '';
  const is_liquid = /\b(ml|cl|l)\b/i.test(quantity);

  return {
    barcode: code,
    name: (p.product_name_de || p.product_name || 'Unbekanntes Produkt').trim(),
    brand: typeof p.brands === 'string' && p.brands ? p.brands.split(',')[0].trim() : undefined,
    kcal_per_100g: kcal ?? 0,
    protein_per_100g: protein ?? 0,
    fat_per_100g: fat ?? 0,
    carbs_per_100g: carbs ?? 0,
    serving_g: num(p.serving_quantity),
    is_liquid,
    incomplete: kcal === undefined || protein === undefined || fat === undefined || carbs === undefined,
  };
}

export function offProductToFoodItem(p: OffProduct, saved: boolean): FoodItem {
  return {
    name: p.name,
    brand: p.brand,
    kcal_per_100g: p.kcal_per_100g,
    protein_per_100g: p.protein_per_100g,
    fat_per_100g: p.fat_per_100g,
    carbs_per_100g: p.carbs_per_100g,
    unit_type: p.is_liquid ? 'volume' : 'weight',
    default_amount: p.serving_g,
    source: 'openfoodfacts',
    barcode: p.barcode,
    saved: saved ? 1 : 0,
    created_at: Date.now(),
  };
}
