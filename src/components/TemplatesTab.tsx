import { useState } from 'react';
import type { MealTemplate, MealType } from '../db/types';
import { applyTemplate, deleteTemplate, useTemplates } from '../db/hooks';
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
  const [busy, setBusy] = useState<number | null>(null);

  if (!templates) return null;
  if (templates.length === 0) {
    return (
      <p className="search-empty">
        Noch keine Vorlagen. Öffne eine Mahlzeit mit Posten im Tagebuch und tippe auf „Als Vorlage speichern“.
      </p>
    );
  }

  return (
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
