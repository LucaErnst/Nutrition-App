import { useState } from 'react';
import type { MealTemplate, MealType } from '../db/types';
import { mealLabel, useT } from '../i18n';
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
  const t = useT();
  const templates = useTemplates();
  const sources = (useCopySources(date) ?? []).filter((s) => !(s.date === date && s.meal_type === mealType));
  const [busy, setBusy] = useState<number | null>(null);

  if (!templates) return null;

  return (
    <div className="search">
      {sources.length > 0 && (
        <>
          <p className="search-hint">{t('tpl.copyFrom')}</p>
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
                      {src.date === date ? t('common.today') : src.date === addDays(date, -1) ? t('common.yesterday') : src.date} · {mealLabel(src.meal_type)}
                    </span>
                    <span className="search-item-portion">
                      {src.entries.length} {src.entries.length === 1 ? t('common.item') : t('common.items')} · {t('macro.p')} {fmt(src.totals.protein)} · {t('macro.f')} {fmt(src.totals.fat)} · {t('macro.c')} {fmt(src.totals.carbs)}
                    </span>
                  </span>
                  <span className="search-item-kcal">{fmt(src.totals.kcal)} kcal</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="search-hint">{t('tpl.templates')}</p>
      {templates.length === 0 && (
        <p className="search-empty">
          {t('tpl.none')}
        </p>
      )}
    <ul className="search-list">
      {templates.map((tpl) => (
        <TemplateRow
          key={tpl.id}
          template={tpl}
          busy={busy === tpl.id}
          onApply={async () => {
            setBusy(tpl.id!);
            await applyTemplate(tpl, date, mealType);
            onDone();
          }}
          onDelete={() => {
            if (confirm(t('tpl.confirmDelete', { name: tpl.name }))) void deleteTemplate(tpl.id!);
          }}
        />
      ))}
    </ul>
    </div>
  );
}

function TemplateRow({ template, busy, onApply, onDelete }: { template: MealTemplate; busy: boolean; onApply: () => void; onDelete: () => void }) {
  const t = useT();
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
            {lines.map((l) => `${fmt(l.item.amount, l.item.amount % 1 ? 1 : 0)} ${l.item.unit === 'Stück' ? t('unit.piece') : l.item.unit} ${l.food.name}`).join(' · ')}
          </span>
          <span className="search-item-portion">
            {t('macro.p')} {fmt(totals.protein)} · {t('macro.f')} {fmt(totals.fat)} · {t('macro.c')} {fmt(totals.carbs)}
          </span>
        </span>
        <span className="search-item-kcal">{fmt(totals.kcal)} kcal</span>
      </button>
      <button className="btn-icon" onClick={onDelete} aria-label={t('tpl.delete', { name: template.name })} title={t('common.delete')}>
        ×
      </button>
    </li>
  );
}
