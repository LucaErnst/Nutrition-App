/**
 * Einheiten für Mengen. Nährwerte liegen immer pro 100 g bzw. 100 ml – jede Einheit rechnet
 * über einen festen Faktor in diese Basis um. Die Codes sind bewusst eindeutig ('floz_us' statt
 * 'floz'): US- und UK-Flüssigunzen sind verschieden gross, und ein eingetragener Wert darf sich
 * nie nachträglich ändern, nur weil der Nutzer das System umstellt.
 */
import type { Unit, UnitType } from '../db/types';
import { getLocale } from '../i18n';

export type UnitSystem = 'metric' | 'us' | 'uk';
/** Woher eine Einheit stammt – bestimmt die Gruppierung im Auswahlmenü. */
export type UnitGroup = 'piece' | 'metric' | 'imperial' | 'us' | 'uk';

interface UnitDef {
  kind: UnitType;
  /** Menge in der Basiseinheit: g bei Gewicht, ml bei Volumen. */
  base: number;
  group: UnitGroup;
  /** Schrittweite des Steppers. */
  step: number;
  /** Unterhalb dieser Menge wird feiner geschritten. */
  fineBelow?: number;
  fineStep?: number;
  /** Höchstens so viele Nachkommastellen anzeigen. */
  digits: number;
  label: string;
}

/** Reihenfolge innerhalb einer Gruppe = Reihenfolge im Auswahlmenü. */
export const UNITS: Record<Unit, UnitDef> = {
  g: { kind: 'weight', base: 1, group: 'metric', step: 10, fineBelow: 20, fineStep: 5, digits: 1, label: 'g' },
  kg: { kind: 'weight', base: 1000, group: 'metric', step: 0.1, fineBelow: 0.5, fineStep: 0.05, digits: 3, label: 'kg' },
  oz: { kind: 'weight', base: 28.349523125, group: 'imperial', step: 0.5, fineBelow: 2, fineStep: 0.25, digits: 2, label: 'oz' },
  lb: { kind: 'weight', base: 453.59237, group: 'imperial', step: 0.25, fineBelow: 1, fineStep: 0.125, digits: 3, label: 'lb' },

  ml: { kind: 'volume', base: 1, group: 'metric', step: 10, fineBelow: 20, fineStep: 5, digits: 1, label: 'ml' },
  cl: { kind: 'volume', base: 10, group: 'metric', step: 1, fineBelow: 5, fineStep: 0.5, digits: 2, label: 'cl' },
  dl: { kind: 'volume', base: 100, group: 'metric', step: 0.5, fineBelow: 1, fineStep: 0.1, digits: 2, label: 'dl' },
  l: { kind: 'volume', base: 1000, group: 'metric', step: 0.1, fineBelow: 0.5, fineStep: 0.05, digits: 3, label: 'l' },

  floz_us: { kind: 'volume', base: 29.5735295625, group: 'us', step: 1, fineBelow: 4, fineStep: 0.5, digits: 2, label: 'fl oz' },
  cup_us: { kind: 'volume', base: 236.5882365, group: 'us', step: 0.25, fineBelow: 1, fineStep: 0.125, digits: 3, label: 'cup' },
  pt_us: { kind: 'volume', base: 473.176473, group: 'us', step: 0.25, fineBelow: 1, fineStep: 0.125, digits: 3, label: 'pt' },
  tbsp_us: { kind: 'volume', base: 14.78676478125, group: 'us', step: 1, fineBelow: 3, fineStep: 0.5, digits: 2, label: 'tbsp' },
  tsp_us: { kind: 'volume', base: 4.92892159375, group: 'us', step: 1, fineBelow: 3, fineStep: 0.25, digits: 2, label: 'tsp' },

  floz_uk: { kind: 'volume', base: 28.4130625, group: 'uk', step: 1, fineBelow: 4, fineStep: 0.5, digits: 2, label: 'fl oz' },
  pt_uk: { kind: 'volume', base: 568.26125, group: 'uk', step: 0.25, fineBelow: 1, fineStep: 0.125, digits: 3, label: 'pt' },
  tbsp_uk: { kind: 'volume', base: 15, group: 'uk', step: 1, fineBelow: 3, fineStep: 0.5, digits: 2, label: 'tbsp' },
  tsp_uk: { kind: 'volume', base: 5, group: 'uk', step: 1, fineBelow: 3, fineStep: 0.25, digits: 2, label: 'tsp' },

  // Basis ist das Stückgewicht des Lebensmittels, nicht ein fester Faktor.
  'Stück': { kind: 'piece', base: 0, group: 'piece', step: 1, digits: 2, label: 'Stück' },
};

export const ALL_UNITS = Object.keys(UNITS) as Unit[];

/**
 * Definition einer Einheit – mit Rückfall für Codes, die wir nicht kennen. Wiederhergestellte
 * Backups können alles enthalten; ein unbekannter Code darf die App nie weissbluten lassen.
 * Der Rückfall rechnet 1:1 in die Basis (wie vor der Einheiten-Umstellung) und zeigt den Code
 * unverändert an, statt eine falsche Einheit vorzutäuschen.
 */
export function unitDef(unit: Unit): UnitDef {
  return UNITS[unit] ?? { ...UNITS.g, label: String(unit) };
}

export function isPieceUnit(unit: Unit): boolean {
  return unitDef(unit).kind === 'piece';
}

/** Menge in der Basiseinheit (g bzw. ml). Stück muss der Aufrufer selbst auflösen. */
export function toBase(amount: number, unit: Unit): number {
  return amount * unitDef(unit).base;
}

/** Umgekehrt: aus g/ml die Menge in der gewünschten Einheit. */
export function fromBase(base: number, unit: Unit): number {
  const f = unitDef(unit).base;
  return f === 0 ? base : base / f;
}

/** Schrittweite: grob, unterhalb einer Schwelle feiner. */
export function stepFor(unit: Unit, current: number): number {
  const d = unitDef(unit);
  if (d.fineBelow !== undefined && d.fineStep !== undefined && current < d.fineBelow) return d.fineStep;
  return d.step;
}

/** Auf die Genauigkeit der Einheit runden. */
export function roundTo(amount: number, unit: Unit): number {
  const f = 10 ** unitDef(unit).digits;
  return Math.round(amount * f) / f;
}

/**
 * Eine Menge von einer Einheit in eine andere ausdrücken – etwa die übliche Portion eines
 * Lebensmittels (in g hinterlegt) für jemanden, der in Unzen einträgt. Stück lässt sich ohne
 * das Stückgewicht nicht umrechnen und bleibt darum unverändert.
 */
export function convertAmount(amount: number, from: Unit, to: Unit): number {
  if (from === to) return amount;
  if (isPieceUnit(from) || isPieceUnit(to)) return amount;
  return roundTo(toBase(amount, from) / unitDef(to).base, to);
}

/** Menge in der für die Einheit sinnvollen Genauigkeit – 250 g, aber 0.75 cup. */
export function fmtAmount(amount: number, unit: Unit): string {
  return amount.toLocaleString(getLocale(), { maximumFractionDigits: unitDef(unit).digits });
}

/** Beschriftung für Export-Dateien: eindeutig, auch ohne Kenntnis des Systems. */
export function csvUnitLabel(unit: Unit): string {
  const d = unitDef(unit);
  if (d.kind === 'piece') return 'pc';
  if (d.group === 'us') return `${d.label} (US)`;
  if (d.group === 'uk') return `${d.label} (UK)`;
  return d.label;
}

const GROUP_ORDER: Record<UnitSystem, UnitGroup[]> = {
  metric: ['metric', 'imperial', 'us', 'uk'],
  us: ['us', 'imperial', 'metric', 'uk'],
  uk: ['uk', 'imperial', 'metric', 'us'],
};

export interface UnitChoiceGroup {
  group: UnitGroup;
  units: Unit[];
}

/**
 * Welche Einheiten zur Auswahl stehen: alle passenden, nach dem System des Nutzers sortiert.
 * Niemand wird ausgesperrt – wer in den USA lebt und ein Etikett in Gramm liest, findet Gramm.
 */
export function unitChoices(kind: UnitType, system: UnitSystem): UnitChoiceGroup[] {
  if (kind === 'piece') return [{ group: 'piece', units: ['Stück'] }];
  const out: UnitChoiceGroup[] = [];
  for (const group of GROUP_ORDER[system]) {
    const units = ALL_UNITS.filter((u) => UNITS[u].kind === kind && UNITS[u].group === group);
    if (units.length) out.push({ group, units });
  }
  return out;
}

/**
 * Auswahl für ein Lebensmittel: Stück-Artikel dürfen zusätzlich nach Gewicht eingetragen
 * werden (eine halbe Banane wiegt man lieber ab).
 */
export function unitChoicesForFood(kind: UnitType, system: UnitSystem): UnitChoiceGroup[] {
  if (kind === 'piece') return [...unitChoices('piece', system), ...unitChoices('weight', system)];
  return unitChoices(kind, system);
}

/** Beschriftung einer Einheit; 'Stück' wird übersetzt hereingereicht. */
export function labelFor(unit: Unit, pieceLabel: string): string {
  const d = unitDef(unit);
  return d.kind === 'piece' ? pieceLabel : d.label;
}

/** Vorgabe für ein Lebensmittel ohne zuletzt benutzte Einheit. */
export function defaultUnitFor(kind: UnitType, system: UnitSystem): Unit {
  if (kind === 'piece') return 'Stück';
  if (kind === 'volume') {
    if (system === 'us') return 'floz_us';
    if (system === 'uk') return 'floz_uk';
    return 'ml';
  }
  return system === 'metric' ? 'g' : 'oz';
}

/**
 * Zuletzt bekanntes System des Nutzers. Die Einstellungen kommen aus der Datenbank und sind
 * beim ersten Render noch nicht da – ohne diesen Zwischenspeicher würde ein Dialog, der in
 * genau diesem Moment aufgeht, die falsche Vorgabe einfrieren.
 */
let cached: UnitSystem | undefined;

export function getUnitSystem(): UnitSystem {
  return cached ?? detectUnitSystem();
}

export function setUnitSystemCache(system: UnitSystem): void {
  cached = system;
}

/**
 * Einheitensystem aus der Gerätesprache. Nur die USA und Grossbritannien weichen ab; alles
 * andere ist metrisch. Umstellbar unter „Mehr“.
 */
export function detectUnitSystem(
  langs: readonly string[] = navigator.languages?.length ? navigator.languages : [navigator.language],
): UnitSystem {
  for (const l of langs) {
    const region = regionOf(l);
    if (region === 'US') return 'us';
    if (region === 'GB' || region === 'UK') return 'uk';
    if (region) return 'metric';
  }
  return 'metric';
}

export function regionOf(tag: string | undefined): string | undefined {
  const parts = (tag ?? '').toUpperCase().split(/[-_]/);
  // en-US, en-GB, de-CH … – die Region ist der zweistellige Teil.
  return parts.slice(1).find((p) => p.length === 2);
}

/* ---------------------------------------------------------------------------
 * Körpermasse: Gewicht und Grösse. Gespeichert wird immer in Kilogramm bzw.
 * Zentimetern – die Einheit ist reine Anzeige- und Eingabesache und folgt dem
 * gewählten System (England wiegt in Stone, die USA in Pfund).
 * ------------------------------------------------------------------------ */

export type BodyWeightUnit = 'kg' | 'lb' | 'st';
export type HeightUnit = 'cm' | 'ftin';

const LB_PER_KG = 2.2046226218487757;
const LB_PER_STONE = 14;
const CM_PER_INCH = 2.54;

export function bodyWeightUnitFor(system: UnitSystem): BodyWeightUnit {
  if (system === 'us') return 'lb';
  if (system === 'uk') return 'st';
  return 'kg';
}

export function heightUnitFor(system: UnitSystem): HeightUnit {
  return system === 'metric' ? 'cm' : 'ftin';
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

/** Stone und Pfund, wie eine britische Waage es anzeigt. */
export function kgToStone(kg: number): { st: number; lb: number } {
  const totalLb = Math.round(kgToLb(kg) * 10) / 10;
  let st = Math.floor(totalLb / LB_PER_STONE);
  let lb = Math.round((totalLb - st * LB_PER_STONE) * 10) / 10;
  // Gerundet darf nie "12 st 14 lb" herauskommen.
  if (lb >= LB_PER_STONE) {
    st += 1;
    lb = 0;
  }
  return { st, lb };
}

export function stoneToKg(st: number, lb: number): number {
  return lbToKg(st * LB_PER_STONE + lb);
}

export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalIn = Math.round(cm / CM_PER_INCH);
  const ft = Math.floor(totalIn / 12);
  return { ft, in: totalIn - ft * 12 };
}

export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * CM_PER_INCH * 10) / 10;
}

/** Körpergewicht in der Einheit des Nutzers – zur Anzeige, gespeichert bleibt es Kilogramm. */
export function fromKg(kg: number, unit: BodyWeightUnit): number {
  return unit === 'kg' ? kg : kgToLb(kg);
}

function n(value: number, digits = 1): string {
  return value.toLocaleString(getLocale(), { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

/** Zahl und Einheit getrennt, damit die Oberfläche die Einheit kleiner setzen kann. */
export interface BodyWeightParts {
  value: string;
  label: string;
  /** Nur bei Stone: der Pfund-Anteil. */
  extra?: { value: string; label: string };
}

export function bodyWeightParts(kg: number, unit: BodyWeightUnit): BodyWeightParts {
  if (unit === 'kg') return { value: n(kg), label: 'kg' };
  if (unit === 'lb') return { value: n(kgToLb(kg)), label: 'lb' };
  const { st, lb } = kgToStone(kg);
  return { value: String(st), label: 'st', extra: { value: n(lb), label: 'lb' } };
}

export function formatBodyWeight(kg: number, unit: BodyWeightUnit): string {
  const p = bodyWeightParts(kg, unit);
  return p.extra ? `${p.value} ${p.label} ${p.extra.value} ${p.extra.label}` : `${p.value} ${p.label}`;
}

/** Einheit, in der Diagramme und Veränderungen dargestellt werden – Stone taugt dafür nicht. */
export function trendUnitFor(unit: BodyWeightUnit): 'kg' | 'lb' {
  return unit === 'kg' ? 'kg' : 'lb';
}

/**
 * Veränderungen werden auch in England in Pfund gedacht – "+0 st 2 lb" liest niemand gern.
 * Das Vorzeichen bleibt immer sichtbar, auch bei null.
 */
export function formatBodyDelta(kgDelta: number, unit: BodyWeightUnit): string {
  const inUnit = unit === 'kg' ? kgDelta : kgToLb(kgDelta);
  const label = unit === 'kg' ? 'kg' : 'lb';
  const sign = inUnit > 0 ? '+' : inUnit < 0 ? '−' : '±';
  return `${sign}${n(Math.abs(inUnit))} ${label}`;
}

export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === 'cm') return `${Math.round(cm)} cm`;
  const { ft, in: inch } = cmToFtIn(cm);
  return `${ft}′ ${inch}″`;
}
