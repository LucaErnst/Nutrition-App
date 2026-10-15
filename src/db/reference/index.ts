/**
 * Grundnahrungsmittel aus dem Bundeslebensmittelschlüssel (BLS 4.0) des Max Rubner-Instituts,
 * Lizenz CC BY 4.0. Kompaktes Format spart beim Laden: Objekte mit sechs Schlüsseln wären
 * rund ein Drittel grösser, und die Tabelle wird einmal geladen, nicht einmal pro Eintrag.
 */
export type ReferenceRow = [key: string, name: string, kcal: number, protein: number, fat: number, carbs: number];

/** Wird nur beim Anlegen gebraucht; darum erst bei Bedarf geladen. */
export async function loadReference(lang: 'de' | 'en'): Promise<ReferenceRow[]> {
  const mod = lang === 'de' ? await import('./de.json') : await import('./en.json');
  return mod.default as ReferenceRow[];
}

/**
 * Amerikanische Grundnahrungsmittel (USDA FoodData Central, SR Legacy, CC0). Nur Englisch und
 * nur in englischer App-Sprache sichtbar (docs/RELEASE-1.2.md A1). Schlüssel `usda:<FDC-ID>`.
 */
export const USDA_PREFIX = 'usda:';

export async function loadUsda(): Promise<ReferenceRow[]> {
  const mod = await import('./usda.json');
  return mod.default as ReferenceRow[];
}
