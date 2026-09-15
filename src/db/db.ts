import Dexie, { type EntityTable } from 'dexie';
import type { DailyGoal, DayInfo, FoodItem, MealEntry, MealTemplate, Settings, WeightEntry } from './types';

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
  }
}

export const db = new NutritionDB();
