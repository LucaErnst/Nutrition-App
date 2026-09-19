/**
 * Zielwert-Assistent: schätzt Kalorien- und Makroziele aus Körperdaten.
 * Grundumsatz nach Mifflin-St Jeor, Aktivitätsfaktor, Phase (Aufbau/Erhalt/Defizit),
 * Trainings-/Ruhetag-Verteilung. Bewusst konservative, gängige Coaching-Regeln.
 */
export type Sex = 'male' | 'female';
export type Activity = 'low' | 'moderate' | 'high' | 'athlete';
export type Phase = 'cut' | 'maintain' | 'bulk';

export interface BodyInput {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity: Activity;
  phase: Phase;
  /** Trainingstage pro Woche (0–7) */
  training_days: number;
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
}

const ACTIVITY_FACTOR: Record<Activity, number> = {
  low: 1.35, // Bürojob, wenig Bewegung
  moderate: 1.5, // 2–3 Einheiten/Woche
  high: 1.65, // 4–5 Einheiten, aktiver Alltag
  athlete: 1.8, // täglich, körperliche Arbeit
};

/** Anpassung des Erhaltungsbedarfs je Phase (Anteil) */
const PHASE_DELTA: Record<Phase, number> = {
  cut: -0.15,
  maintain: 0,
  bulk: 0.1,
};

export function bmrMifflin(sex: Sex, age: number, height_cm: number, weight_kg: number): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

const round50 = (n: number) => Math.round(n / 50) * 50;
const round5 = (n: number) => Math.round(n / 5) * 5;

export function suggestGoals(b: BodyInput): GoalSuggestion {
  const bmr = bmrMifflin(b.sex, b.age, b.height_cm, b.weight_kg);
  const tdee = bmr * ACTIVITY_FACTOR[b.activity];
  const weekly = tdee * 7 * (1 + PHASE_DELTA[b.phase]);

  // Trainingstage bekommen mehr (+ ca. 300 kcal), Ruhetage entsprechend weniger,
  // so dass die Woche insgesamt stimmt.
  const trainingDays = Math.min(7, Math.max(0, Math.round(b.training_days)));
  const restDays = 7 - trainingDays;
  const spread = trainingDays > 0 && restDays > 0 ? 300 : 0;
  const avg = weekly / 7;
  const rest = avg - (spread * trainingDays) / 7;
  const training = rest + spread;

  // Protein: 2.0 g/kg im Defizit, 1.8 g/kg sonst. Fett: 0.8–1.0 g/kg.
  const proteinPerKg = b.phase === 'cut' ? 2.0 : 1.8;
  const protein = round5(b.weight_kg * proteinPerKg);
  const fatMin = round5(b.weight_kg * 0.8);
  const fatMax = round5(b.weight_kg * 1.0);

  // Wasser: ~35 ml/kg, auf 250 ml gerundet, min. 2 l
  const water = Math.max(2000, Math.round((b.weight_kg * 35) / 250) * 250);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    training_day_kcal: round50(trainingDays > 0 ? training : avg),
    rest_day_kcal: round50(restDays > 0 ? rest : avg),
    protein_g: protein,
    fat_min_g: fatMin,
    fat_max_g: fatMax,
    water_ml: water,
  };
}
