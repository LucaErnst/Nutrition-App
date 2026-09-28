import { CapacitorHttp } from '@capacitor/core';
import type { FoodItem } from '../db/types';
import { getLanguage, t } from '../i18n';
import { isNative } from './native';

const APP_NAME = 'LucaNutritionTracker';
const APP_VERSION = __APP_VERSION__;

/** Nur die Felder anfordern, die wir wirklich brauchen (kleinere Antwort). */
const FIELDS = [
  'code',
  'product_name',
  'product_name_de',
  'product_name_en',
  'product_name_fr',
  'product_name_it',
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
  if (!code) return { status: 'error', message: t('off.errInvalid') };

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
      return { status: 'error', message: t('off.errTimeout') };
    }
    return { status: 'error', message: t('off.errOffline') };
  }

  if (res.status === 404) return { status: 'not_found' };
  if (res.status === 429) return { status: 'error', message: t('off.errRate') };
  if (!res.ok) return { status: 'error', message: t('off.errStatus', { status: res.status }) };

  const json = await res.json();
  if (json.status === 0 || !json.product) return { status: 'not_found' };
  // Leere Hülle ohne Name und Nährwerte ist für uns wertlos.
  const p = json.product;
  if (!p.product_name && !p.product_name_de && !p.nutriments) return { status: 'not_found' };

  return { status: 'found', product: parseProduct(code, p) };
}

export type OffSearchResult =
  | { status: 'found'; products: OffProduct[]; total: number; page: number; hasMore: boolean }
  | { status: 'error'; message: string };

export interface OffSearchOptions {
  /** 1-basiert; für „mehr laden" */
  page?: number;
}

/** Treffer pro Seite. Mehr holt der Nutzer über „mehr laden" nach. */
export const PAGE_SIZE = 24;

/**
 * Mindestabstand zwischen zwei Suchanfragen. Der klassische Endpunkt verträgt nur ~10 pro
 * Minute; der Suchdienst der nativen App ist belastbarer.
 */
export const SEARCH_MIN_INTERVAL_MS = 6_000;
const SEARCH_MIN_INTERVAL_NATIVE_MS = 2_000;
let lastSearchAt = 0;

export function searchCooldownMs(): number {
  const min = isNative ? SEARCH_MIN_INTERVAL_NATIVE_MS : SEARCH_MIN_INTERVAL_MS;
  return Math.max(0, lastSearchAt + min - Date.now());
}

class BusyError extends Error {}

/**
 * JSON holen. In der nativen App über Capacitors HTTP-Brücke: Die gute Suche von Open Food
 * Facts sendet keine CORS-Header, im Browser ist sie darum gesperrt – nativ nicht.
 */
async function getJson(url: string, timeoutMs: number): Promise<any> {
  if (isNative) {
    const res = await CapacitorHttp.get({
      url,
      headers: { Accept: 'application/json' },
      connectTimeout: timeoutMs,
      readTimeout: timeoutMs,
    });
    if (res.status === 429 || res.status === 503) throw new BusyError();
    if (res.status >= 400) throw new Error(String(res.status));
    return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  }
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
  if (res.status === 429 || res.status === 503) throw new BusyError();
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/**
 * Der alte Endpunkt antwortet oft mit 503 – gemessen etwa bei jeder zweiten Anfrage. Im Browser
 * kommt das nicht einmal als Status an: Die Fehlerseite trägt keinen CORS-Header, also sieht die
 * App nur einen Netzwerkfehler. Darum wird bei jedem Fehlschlag nachgefasst, nicht nur bei 503.
 * Nur eindeutige 4xx sind endgültig.
 */
async function getJsonRetrying(url: string, timeoutMs: number, attempts = 4): Promise<any> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await getJson(url, timeoutMs);
    } catch (e) {
      last = e;
      const status = e instanceof Error && /^\d{3}$/.test(e.message) ? Number(e.message) : undefined;
      if (status !== undefined && status < 500 && status !== 429) throw e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw last;
}

/**
 * Freitextsuche. Zwei Wege, weil kein Dienst beides kann:
 *
 * - nativ: der neue Suchdienst (gute Treffer, zuverlässig) für die Codes, danach ein einziger
 *   Aufruf der v2-Schnittstelle für die Nährwerte aller Treffer. Der Suchdienst liefert keine
 *   Nährwerte, die v2-Schnittstelle keine Volltextsuche.
 * - Web: der klassische Endpunkt, der beides liefert, aber häufig mit 503 antwortet – darum
 *   mit Wiederholung.
 */
export async function searchProducts(query: string, opts: OffSearchOptions = {}): Promise<OffSearchResult> {
  const q = query.trim();
  if (q.length < 2) return { status: 'error', message: t('off.errShort') };
  const page = Math.max(1, opts.page ?? 1);
  const wait = searchCooldownMs();
  if (wait > 0) return { status: 'error', message: t('off.errCooldown', { s: Math.ceil(wait / 1000) }) };
  lastSearchAt = Date.now();

  try {
    const products = isNative ? await searchModern(q, page) : await searchClassic(q, page);
    return products;
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') return { status: 'error', message: t('off.errSearchTimeout') };
    if (e instanceof Error && /^\d{3}$/.test(e.message)) {
      const code = Number(e.message);
      if (code < 500 && code !== 429) return { status: 'error', message: t('off.errStatus', { status: code }) };
    }
    // Nach mehreren Versuchen: Wer wirklich offline ist, weiss es; alles andere ist Überlastung
    // auf der Gegenseite und kein Fehler des Nutzers.
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return { status: 'error', message: offline ? t('off.errOffline') : t('off.errBusy') };
  }
}

/** Nativ: Suchdienst für die Reihenfolge, v2 für die Nährwerte. */
async function searchModern(q: string, page: number): Promise<OffSearchResult> {
  const url = new URL('https://search.openfoodfacts.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(PAGE_SIZE));
  url.searchParams.set('langs', getLanguage());
  url.searchParams.set('fields', 'code');

  const json = await getJsonRetrying(url.toString(), 12_000);
  const hits: any[] = Array.isArray(json?.hits) ? json.hits : [];
  const codes = hits.map((h) => String(h?.code ?? '')).filter(Boolean);
  if (codes.length === 0) return { status: 'found', products: [], total: 0, page, hasMore: false };

  const products = await fetchByCodes(codes);
  const total = Number(json?.count ?? products.length);
  return { status: 'found', products, total, page, hasMore: page * PAGE_SIZE < total };
}

/** Nährwerte für mehrere Codes in einem Aufruf; die Reihenfolge der Suche bleibt erhalten. */
async function fetchByCodes(codes: string[]): Promise<OffProduct[]> {
  const url = new URL('https://world.openfoodfacts.org/api/v2/search');
  url.searchParams.set('code', codes.join('|'));
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('page_size', String(codes.length));
  url.searchParams.set('app_name', APP_NAME);
  url.searchParams.set('app_version', APP_VERSION);

  const json = await getJsonRetrying(url.toString(), 12_000);
  const list: any[] = Array.isArray(json?.products) ? json.products : [];
  const byCode = new Map<string, OffProduct>();
  for (const raw of list) {
    const code = String(raw?.code ?? '');
    if (code) byCode.set(code, parseProduct(code, raw));
  }
  return sortUsable(codes.map((c) => byCode.get(c)).filter((p): p is OffProduct => !!p));
}

/** Web: der klassische Endpunkt liefert Treffer und Nährwerte zusammen. */
async function searchClassic(q: string, page: number): Promise<OffSearchResult> {
  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('search_terms', q);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('lc', getLanguage());
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(PAGE_SIZE));
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('app_name', APP_NAME);
  url.searchParams.set('app_version', APP_VERSION);

  const json = await getJsonRetrying(url.toString(), 15_000);
  const list: any[] = Array.isArray(json?.products) ? json.products : [];
  const products = sortUsable(list.map((h) => parseProduct(String(h?.code ?? ''), h)).filter((p) => p.barcode));
  const total = Number(json?.count ?? products.length);
  return { status: 'found', products, total, page, hasMore: page * PAGE_SIZE < total };
}

/** Produkte mit vollständigen Nährwerten zuerst; ohne Namen fliegen raus. */
function sortUsable(products: OffProduct[]): OffProduct[] {
  return products
    .filter((p) => p.name !== t('off.unknownProduct'))
    .sort((a, b) => Number(a.incomplete) - Number(b.incomplete));
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
    name: (localizedName(p) || t('off.unknownProduct')).trim(),
    brand: parseBrand(p.brands),
    kcal_per_100g: kcal ?? 0,
    protein_per_100g: protein ?? 0,
    fat_per_100g: fat ?? 0,
    carbs_per_100g: carbs ?? 0,
    serving_g: num(p.serving_quantity),
    is_liquid,
    incomplete: kcal === undefined || protein === undefined || fat === undefined || carbs === undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function localizedName(p: any): string {
  const lang = getLanguage();
  const direct = p[`product_name_${lang}`] || p.product_name_de || p.product_name_en || p.product_name;
  if (typeof direct === 'string' && direct.trim()) return direct;
  // Schweizer Produkte tragen oft nur einen französischen oder italienischen Namen. Lieber den
  // als gar keinen – sonst fehlt das Produkt in der Liste, obwohl es die Datenbank kennt.
  for (const [key, value] of Object.entries(p ?? {})) {
    if (key.startsWith('product_name_') && typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function parseBrand(v: unknown): string | undefined {
  const first = Array.isArray(v) ? v[0] : typeof v === 'string' ? v.split(',')[0] : undefined;
  const b = typeof first === 'string' ? first.trim() : '';
  return b || undefined;
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
