import { useState } from 'react';
import { MEAL_LABELS, type MealTemplate, type MealType } from '../db/types';
import { applyTemplate, copyMeal, deleteTemplate, useCopySources, useTemplates } from '../db/hooks';
import { addDays } from '../lib/date';
import { fmt, macrosFor, sumMacros } from '../lib/nutrition';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface Props {
  date: string;
  mealType: MealType;
  onDone: () => void;
}

export function TemplatesTab({ date, mealType, onDone }: Props) {
  const templates = useTemplates();
  const sources = (useCopySources(date) ?? []).filter((s) => !(s.date === date && s.meal_type === mealType));
  const [busy, setBusy] = useState<number | null>(null);

  if (!templates) return null;

  return (
    <div className="search">
      {sources.length > 0 && (
        <>
          <p className="search-hint">Kopieren von</p>
          <ul className="search-list">
            {sources.map((src) => (
              <li key={`${src.date}|${src.meal_type}`}>
                <button
                  className="search-item"
                  onClick={async () => {
                    await copyMeal(src, date, mealType);
                    onDone();
                  }}
                >
                  <span className="search-item-main">
                    <span className="search-item-name">
                      {src.date === date ? 'Heute' : src.date === addDays(date, -1) ? 'Gestern' : src.date} · {MEAL_LABELS[src.meal_type]}
                    </span>
                    <span className="search-item-portion">
                      {src.entries.length} Posten · P {fmt(src.totals.protein)} · F {fmt(src.totals.fat)} · KH {fmt(src.totals.carbs)}
                    </span>
                  </span>
                  <span className="search-item-kcal">{fmt(src.totals.kcal)} kcal</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="search-hint">Vorlagen</p>
      {templates.length === 0 && (
        <p className="search-empty">
          Noch keine Vorlagen. Öffne eine Mahlzeit mit Posten im Tagebuch und tippe auf „Als Vorlage speichern“.
        </p>
      )}
    <ul className="search-list">
      {templates.map((t) => (
        <TemplateRow
          key={t.id}
          template={t}
          busy={busy === t.id}
          onApply={async () => {
            setBusy(t.id!);
            await applyTemplate(t, date, mealType);
            onDone();
          }}
          onDelete={() => {
            if (confirm(`Vorlage „${t.name}“ löschen?`)) void deleteTemplate(t.id!);
          }}
        />
      ))}
    </ul>
    </div>
  );
}

function TemplateRow({ template, busy, onApply, onDelete }: { template: MealTemplate; busy: boolean; onApply: () => void; onDelete: () => void }) {
  // Lebensmittel der Vorlage laden, um Summe und Zeilen anzuzeigen
  const foods = useLiveQuery(() => db.foodItems.bulkGet(template.items.map((i) => i.food_item_id)), [template.id]);
  const lines = (foods ?? []).flatMap((f, i) => (f ? [{ food: f, item: template.items[i] }] : []));
  const totals = sumMacros(lines.map((l) => macrosFor(l.food, l.item.amount, l.item.unit)));

  return (
    <li className="template">
      <button className="search-item" onClick={onApply} disabled={busy}>
        <span className="search-item-main">
          <span className="search-item-name">{template.name}</span>
          <span className="search-item-portion">
            {lines.map((l) => `${fmt(l.item.amount, l.item.amount % 1 ? 1 : 0)} ${l.item.unit} ${l.food.name}`).join(' · ')}
          </span>
          <span className="search-item-portion">
            P {fmt(totals.protein)} · F {fmt(totals.fat)} · KH {fmt(totals.carbs)}
          </span>
        </span>
        <span className="search-item-kcal">{fmt(totals.kcal)} kcal</span>
      </button>
      <button className="btn-icon" onClick={onDelete} aria-label={`Vorlage ${template.name} löschen`} title="Löschen">
        ×
      </button>
    </li>
  );
}
