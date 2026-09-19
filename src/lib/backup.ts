import { db } from '../db/db';
import type { DailyGoal, DayInfo, FoodItem, MealEntry, MealTemplate, Settings, WeightEntry } from '../db/types';

export const BACKUP_VERSION = 1;

export interface Backup {
  app: 'nutrition-tracker';
  version: number;
  exported_at: string;
  foodItems: FoodItem[];
  mealEntries: MealEntry[];
  goals: DailyGoal[];
  weights: WeightEntry[];
  days: DayInfo[];
  settings: Settings[];
  templates: MealTemplate[];
}

export async function createBackup(): Promise<Backup> {
  const [foodItems, mealEntries, goals, weights, days, settings, templates] = await Promise.all([
    db.foodItems.toArray(),
    db.mealEntries.toArray(),
    db.goals.toArray(),
    db.weights.toArray(),
    db.days.toArray(),
    db.settings.toArray(),
    db.templates.toArray(),
  ]);
  return {
    app: 'nutrition-tracker',
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    foodItems,
    mealEntries,
    goals,
    weights,
    days,
    settings,
    templates,
  };
}

export function backupFilename(): string {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `ernaehrung-backup-${iso}.json`;
}

/** Bietet die Datei per Share-Sheet (iOS) oder als Download an. */
export async function exportBackup(): Promise<'shared' | 'downloaded'> {
  const how = await doExport();
  await markBackupDone();
  return how;
}

async function markBackupDone() {
  const cur = (await db.settings.get(1)) ?? { id: 1 as const, training_weekdays: [1, 2, 4, 5] };
  await db.settings.put({ ...cur, last_backup_at: Date.now() });
}

async function doExport(): Promise<'shared' | 'downloaded'> {
  const backup = await createBackup();
  const json = JSON.stringify(backup, null, 2);
  const file = new File([json], backupFilename(), { type: 'application/json' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Ernährung Backup' });
      return 'shared';
    } catch (e) {
      // Abbruch durch Nutzer → nichts tun; anderer Fehler → Download versuchen
      if (e instanceof Error && e.name === 'AbortError') throw e;
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Datei ist kein gültiges JSON.');
  }
  const b = data as Partial<Backup>;
  if (!b || b.app !== 'nutrition-tracker') throw new Error('Datei ist kein Backup dieser App.');
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) {
    throw new Error('Backup stammt aus einer neueren App-Version.');
  }
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    app: 'nutrition-tracker',
    version: b.version,
    exported_at: b.exported_at ?? '',
    foodItems: arr(b.foodItems),
    mealEntries: arr(b.mealEntries),
    goals: arr(b.goals),
    weights: arr(b.weights),
    days: arr(b.days),
    settings: arr(b.settings),
    templates: arr(b.templates),
  };
}

/** Ersetzt alle lokalen Daten durch das Backup (IDs bleiben erhalten). */
export async function restoreBackup(b: Backup): Promise<void> {
  await db.transaction('rw', [db.foodItems, db.mealEntries, db.goals, db.weights, db.days, db.settings, db.templates], async () => {
    await Promise.all([
      db.foodItems.clear(),
      db.mealEntries.clear(),
      db.goals.clear(),
      db.weights.clear(),
      db.days.clear(),
      db.settings.clear(),
      db.templates.clear(),
    ]);
    await db.foodItems.bulkAdd(b.foodItems);
    await db.mealEntries.bulkAdd(b.mealEntries);
    await db.goals.bulkAdd(b.goals);
    await db.weights.bulkAdd(b.weights);
    await db.days.bulkAdd(b.days);
    await db.settings.bulkAdd(b.settings);
    await db.templates.bulkAdd(b.templates);
  });
}
