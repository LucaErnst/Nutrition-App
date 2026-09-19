import Dexie, { type EntityTable } from 'dexie';
import { snapshotOf, type DailyGoal, type DayInfo, type FoodItem, type MealEntry, type MealTemplate, type Settings, type WeightEntry } from './types';

class NutritionDB extends Dexie {
  foodItems!: EntityTable<FoodItem, 'id'>;
  mealEntries!: EntityTable<MealEntry, 'id'>;
  goals!: EntityTable<DailyGoal, 'id'>;
  weights!: EntityTable<WeightEntry, 'id'>;
  days!: EntityTable<DayInfo, 'date'>;
  settings!: EntityTable<Settings, 'id'>;
  templates!: EntityTable<MealTemplate, 'id'>;

  constructor() {
    super('nutrition-tracker');
    this.version(1).stores({
      foodItems: '++id, name, barcode, source, saved',
      mealEntries: '++id, date, [date+meal_type], food_item_id',
      goals: '++id, start_date',
      weights: '++id, &date',
    });
    this.version(2).stores({
      days: '&date',
      settings: 'id',
    });
    this.version(3).stores({
      templates: '++id, name',
    });
    // v4: Nährwert-Snapshot pro Eintrag; bestehende Einträge werden befüllt.
    this.version(4)
      .stores({})
      .upgrade(async (tx) => {
        const foods = await tx.table<FoodItem>('foodItems').toArray();
        const byId = new Map(foods.map((f) => [f.id!, f]));
        await tx
          .table<MealEntry>('mealEntries')
          .toCollection()
          .modify((entry) => {
            const food = byId.get(entry.food_item_id);
            if (!entry.snapshot && food) entry.snapshot = snapshotOf(food);
          });
      });
  }
}

export const db = new NutritionDB();
