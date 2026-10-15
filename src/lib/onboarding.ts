/**
 * Bedarfsrechner: schätzt Kalorien- und Makroziele aus Körperdaten.
 *
 * Grundumsatz nach Mifflin-St Jeor (Geschlecht, Alter, Grösse, Gewicht). Den Gesamtbedarf liefert
 * der PAL-Wert (Physical Activity Level) nach den Referenzwerten der Deutschen Gesellschaft für
 * Ernährung (DGE, „Energie", Tabelle Arbeitsschwere und Freizeitverhalten): Alltag und Training
 * werden getrennt erfasst, weil ein Handwerker ohne Sport und ein Bürojob mit fünf Einheiten sonst
 * in derselben Stufe landen.
 *
 * Das Ergebnis ist ein Startpunkt. Nach zwei bis drei Wochen zählt der Gewichtstrend
 * (docs/COACHING-RULES.md).
 */
export type Sex = 'male' | 'female';
/** Alltag ohne Training – die vier DGE-Stufen für Beruf und Freizeit */
export type Lifestyle = 'sitting' | 'mixed' | 'standing' | 'physical';
export type Phase = 'cut' | 'maintain' | 'bulk';

export interface BodyInput {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  lifestyle: Lifestyle;
  phase: Phase;
  /** Trainingstage pro Woche (0–7) */
  training_days: number;
}

/** Herleitung in kcal pro Tag, für die Tabelle im Ergebnis */
export interface NeedsSteps {
  bmr: number;
  /** Zuschlag Alltag */
  lifestyle: number;
  /** Zuschlag Training, auf alle Tage verteilt */
  training: number;
  maintenance: number;
  /** Zu- oder Abschlag der Phase (negativ im Defizit) */
  phase: number;
  /** Tagesschnitt des Ziels, nach Untergrenze */
  target: number;
}

export interface GoalSuggestion {
  bmr: number;
  tdee: number;
  training_day_kcal: number;
  rest_day_kcal: number;
  protein_g: number;
  fat_min_g: number;
  fat_max_g: number;
  water_ml: number;
  steps: NeedsSteps;
  /** true, wenn die Untergrenze (Grundumsatz) das Ziel angehoben hat */
  floored: boolean;
  /** Gewicht, auf das Protein und Fett gerechnet sind (bei BMI > 30 kleiner als das Körpergewicht) */
  reference_weight_kg: number;
}

/**
 * PAL für den Alltag ohne Sport, DGE-Stufen:
 * sitzend 1,4–1,5 (Büro) · sitzend, zeitweise gehend/stehend 1,6–1,7 · überwiegend gehend/stehend
 * 1,8–1,9 (Verkauf, Handwerk, Service) · körperlich anstrengend 2,0–2,4 (Bau, Landwirtschaft).
 * Jeweils der untere Wert, weil Training separat dazukommt.
 */
export const LIFESTYLE_PAL: Record<Lifestyle, number> = {
  sitting: 1.4,
  mixed: 1.6,
  standing: 1.8,
  physical: 2.0,
};

/**
 * DGE: Sport oder anstrengende Freizeit 4–5 × pro Woche (30–60 min) erhöht den PAL um 0,3.
 * Pro Trainingstag in der Woche also rund 0,07.
 */
export const TRAINING_PAL_PER_DAY = 0.07;

/** Anpassung des Erhaltungsbedarfs je Phase (Anteil) */
const PHASE_DELTA: Record<Phase, number> = {
  cut: -0.15,
  maintain: 0,
  bulk: 0.1,
};

/** Ab diesem BMI rechnen Protein und Fett mit dem Gewicht bei BMI 25 statt mit dem Körpergewicht. */
const BMI_REFERENCE_LIMIT = 30;
const BMI_REFERENCE = 25;

export function bmrMifflin(sex: Sex, age: number, height_cm: number, weight_kg: number): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

const round50 = (n: number) => Math.round(n / 50) * 50;
const round5 = (n: number) => Math.round(n / 5) * 5;

export function suggestGoals(b: BodyInput): GoalSuggestion {
  const bmr = bmrMifflin(b.sex, b.age, b.height_cm, b.weight_kg);
  const trainingDays = Math.min(7, Math.max(0, Math.round(b.training_days)));
  const lifestyleKcal = bmr * (LIFESTYLE_PAL[b.lifestyle] - 1);
  const trainingKcal = bmr * TRAINING_PAL_PER_DAY * trainingDays;
  const tdee = bmr + lifestyleKcal + trainingKcal;
  const phaseKcal = tdee * PHASE_DELTA[b.phase];

  // Trainingstage bekommen 300 kcal mehr, Ruhetage entsprechend weniger, die Woche stimmt.
  const restDays = 7 - trainingDays;
  const spread = trainingDays > 0 && restDays > 0 ? 300 : 0;
  const avg = tdee + phaseKcal;
  let rest = avg - (spread * trainingDays) / 7;
  // Untergrenze: Auch der Ruhetag liegt nie unter dem Grundumsatz.
  const floored = rest < bmr;
  if (floored) rest = bmr;
  const training = rest + spread;
  const target = (training * trainingDays + rest * restDays) / 7;

  const heightM = b.height_cm / 100;
  const bmi = b.weight_kg / (heightM * heightM);
  const refWeight = bmi > BMI_REFERENCE_LIMIT ? Math.round(BMI_REFERENCE * heightM * heightM) : b.weight_kg;

  // Protein: 2.0 g/kg im Defizit, 1.8 g/kg sonst. Fett: 0.8–1.0 g/kg.
  const proteinPerKg = b.phase === 'cut' ? 2.0 : 1.8;

  // Wasser: ~35 ml/kg, auf 250 ml gerundet, min. 2 l
  const water = Math.max(2000, Math.round((b.weight_kg * 35) / 250) * 250);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    training_day_kcal: round50(trainingDays > 0 ? training : rest),
    rest_day_kcal: round50(restDays > 0 ? rest : training),
    protein_g: round5(refWeight * proteinPerKg),
    fat_min_g: round5(refWeight * 0.8),
    fat_max_g: round5(refWeight * 1.0),
    water_ml: water,
    steps: {
      bmr: Math.round(bmr),
      lifestyle: Math.round(lifestyleKcal),
      training: Math.round(trainingKcal),
      maintenance: Math.round(tdee),
      phase: Math.round(target - tdee),
      target: Math.round(target),
    },
    floored,
    reference_weight_kg: refWeight,
  };
}
