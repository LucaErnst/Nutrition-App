/**
 * Pro-Kauf (einmalig) über RevenueCat. Free bleibt: Tagebuch, Scan, Suche, Wasser, Ziele,
 * Woche, Wochenbudget, Erinnerungen, Backup. Pro: Vorlagen, Kopieren, Portionen, Gewichtstrend,
 * Widgets, Apple Health, Phasen-Auswertung, CSV.
 *
 * Early Adopter: Wer die App vor 1.1 installiert hatte (beim ersten Start mit Kauf-Logik schon
 * Einträge in der Datenbank), bekommt Pro dauerhaft geschenkt – lokal gespeichert.
 * Web/PWA: kein Kauf möglich, Pro-Features bleiben dort frei (die Web-Version ist die Demo).
 */
import { useSyncExternalStore } from 'react';
import { db } from '../db/db';
import { logError } from './errorLog';
import { isNative } from './native';

export const RC_API_KEY_IOS = 'appl_cOUBwfrwkZaobSslLHLMBqyzxDZ';
export const ENTITLEMENT = 'serious_nutrition_pro';

export type ProSource = 'purchase' | 'early_adopter' | 'web' | 'none';

interface ProState {
  pro: boolean;
  source: ProSource;
  /** Preis aus dem Store, z.B. "CHF 15.00" – erst nach dem Laden der Angebote */
  price?: string;
  ready: boolean;
}

let state: ProState = { pro: !isNative, source: isNative ? 'none' : 'web', ready: !isNative };
const listeners = new Set<() => void>();

function set(patch: Partial<ProState>) {
  state = { ...state, ...patch };
  for (const fn of listeners) fn();
}

export function useProState(): ProState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state,
  );
}

export function usePro(): boolean {
  return useProState().pro;
}

export function isPro(): boolean {
  return state.pro;
}

/** Nur zum Ansehen der Sperren: Early Adopter können sich vorübergehend als Free-Nutzer sehen (bis zum Neustart). */
let previewFree = false;
export function setPreviewFree(v: boolean) {
  previewFree = v;
  set({ pro: v ? false : state.source !== 'none' });
}
export function isPreviewFree(): boolean {
  return previewFree;
}

let pkg: import('@revenuecat/purchases-capacitor').PurchasesPackage | null = null;

/** Beim Start: SDK konfigurieren, Status laden, Early Adopter prüfen. */
export async function initPro(): Promise<void> {
  if (!isNative) return;
  try {
    const settings = await db.settings.get(1);
    if (settings?.pro_granted === 'early_adopter') {
      set({ pro: true, source: 'early_adopter', ready: true });
    } else if (settings?.pro_granted === undefined) {
      // Erster Start mit Kauf-Logik: bestehende Nutzer behalten alles
      const entries = await db.mealEntries.count();
      const grant = entries >= 5 ? 'early_adopter' : 'none';
      await db.settings.put({ ...(settings ?? { id: 1 as const, training_weekdays: [1, 2, 4, 5] }), pro_granted: grant });
      if (grant === 'early_adopter') set({ pro: true, source: 'early_adopter', ready: true });
    }

    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    await Purchases.setLogLevel({ level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR });
    await Purchases.configure({ apiKey: RC_API_KEY_IOS });
    await Purchases.addCustomerInfoUpdateListener((info) => applyCustomerInfo(info));
    const { customerInfo } = await Purchases.getCustomerInfo();
    applyCustomerInfo(customerInfo);
    void loadOffering();
  } catch (e) {
    logError('pro', e);
    set({ ready: true });
  }
}

function applyCustomerInfo(info: import('@revenuecat/purchases-capacitor').CustomerInfo) {
  const active = !!info.entitlements.active[ENTITLEMENT];
  if (active) set({ pro: true, source: 'purchase', ready: true });
  else if (state.source !== 'early_adopter') set({ pro: false, source: 'none', ready: true });
  else set({ ready: true });
}

async function loadOffering(): Promise<void> {
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const offerings = await Purchases.getOfferings();
    pkg = offerings.current?.lifetime ?? offerings.current?.availablePackages[0] ?? null;
    if (pkg) set({ price: pkg.product.priceString });
  } catch (e) {
    logError('pro', e);
  }
}

export type PurchaseResult = 'purchased' | 'cancelled' | 'error' | 'unavailable';

export async function purchasePro(): Promise<PurchaseResult> {
  if (!isNative) return 'unavailable';
  try {
    if (!pkg) await loadOffering();
    if (!pkg) return 'unavailable';
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    applyCustomerInfo(customerInfo);
    return state.pro ? 'purchased' : 'error';
  } catch (e) {
    const err = e as { code?: string; userCancelled?: boolean; message?: string };
    if (err?.userCancelled || String(err?.code) === '1' || /cancel/i.test(err?.message ?? '')) return 'cancelled';
    logError('pro', e);
    return 'error';
  }
}

export async function restorePro(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();
    applyCustomerInfo(customerInfo);
    return state.pro;
  } catch (e) {
    logError('pro', e);
    return false;
  }
}
