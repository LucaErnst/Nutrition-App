import { db } from '../db/db';
import { backfillSnapshots } from '../db/hooks';
import { t } from '../i18n';
import { isNative, shareFile } from './native';
import type { DailyGoal, DayInfo, FoodItem, MealEntry, MealTemplate, Settings, WaterEntry, WeightEntry } from '../db/types';

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
  water: WaterEntry[];
}

export async function createBackup(): Promise<Backup> {
  const [foodItems, mealEntries, goals, weights, days, settings, templates, water] = await Promise.all([
    db.foodItems.toArray(),
    db.mealEntries.toArray(),
    db.goals.toArray(),
    db.weights.toArray(),
    db.days.toArray(),
    db.settings.toArray(),
    db.templates.toArray(),
    db.water.toArray(),
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
    water,
  };
}

export function backupFilename(): string {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `serious-nutrition-backup-${iso}.json`;
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
  return shareFile(file);
}

export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(t('backup.errJson'));
  }
  const b = data as Partial<Backup>;
  if (!b || b.app !== 'nutrition-tracker') throw new Error(t('backup.errNotBackup'));
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) {
    throw new Error(t('backup.errNewer'));
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
    water: arr(b.water),
  };
}

/** Ersetzt alle lokalen Daten durch das Backup (IDs bleiben erhalten). */
export async function restoreBackup(b: Backup): Promise<void> {
  await db.transaction('rw', [db.foodItems, db.mealEntries, db.goals, db.weights, db.days, db.settings, db.templates, db.water], async () => {
    await Promise.all([
      db.foodItems.clear(),
      db.mealEntries.clear(),
      db.goals.clear(),
      db.weights.clear(),
      db.days.clear(),
      db.settings.clear(),
      db.templates.clear(),
      db.water.clear(),
    ]);
    await db.foodItems.bulkAdd(b.foodItems);
    await db.mealEntries.bulkAdd(b.mealEntries);
    await db.goals.bulkAdd(b.goals);
    await db.weights.bulkAdd(b.weights);
    await db.days.bulkAdd(b.days);
    await db.settings.bulkAdd(b.settings);
    await db.templates.bulkAdd(b.templates);
    await db.water.bulkAdd(b.water);
  });
  // Backups aus Versionen vor 0.4 haben keine Snapshots
  await backfillSnapshots();
}

// --- Automatisches Backup (nur nativ) ------------------------------------------

export const AUTO_BACKUP_DIR = 'Serious Nutrition Backups';
const AUTO_BACKUP_KEEP = 7;
const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Schreibt höchstens einmal täglich ein Backup in den Dokumente-Ordner der App
 * (iOS: Dateien-App → „Auf meinem iPhone“ → Serious Nutrition; wird mit dem
 * iCloud-Geräte-Backup gesichert). Behält die letzten 7 Dateien.
 */
export async function autoBackupIfDue(): Promise<boolean> {
  if (!isNative) return false;
  const settings = await db.settings.get(1);
  const last = settings?.last_auto_backup_at ?? 0;
  if (Date.now() - last < AUTO_BACKUP_INTERVAL_MS) return false;
  if ((await db.mealEntries.count()) === 0 && (await db.weights.count()) === 0) return false;

  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const backup = await createBackup();
  const json = JSON.stringify(backup);
  await Filesystem.mkdir({ path: AUTO_BACKUP_DIR, directory: Directory.Documents, recursive: true }).catch(() => undefined);
  await Filesystem.writeFile({
    path: `${AUTO_BACKUP_DIR}/${backupFilename()}`,
    data: json,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });

  // Alte Backups aufräumen
  try {
    const list = await Filesystem.readdir({ path: AUTO_BACKUP_DIR, directory: Directory.Documents });
    const files = list.files
      .map((f) => f.name)
      .filter((n) => (n.startsWith('serious-nutrition-backup-') || n.startsWith('ernaehrung-backup-')) && n.endsWith('.json'))
      .sort();
    for (const name of files.slice(0, Math.max(0, files.length - AUTO_BACKUP_KEEP))) {
      await Filesystem.deleteFile({ path: `${AUTO_BACKUP_DIR}/${name}`, directory: Directory.Documents });
    }
  } catch {
    /* Aufräumen ist optional */
  }

  await db.settings.put({ ...(settings ?? { id: 1 as const, training_weekdays: [1, 2, 4, 5] }), last_auto_backup_at: Date.now() });
  return true;
}
