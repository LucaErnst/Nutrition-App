import { useState } from 'react';
import type { MealType } from '../db/types';
import { copyMeal, deleteMealEntry, restoreMealEntry, saveTemplate, updateMealEntryAmount, useCopySources } from '../db/hooks';
import { addDays } from '../lib/date';
import { fmt, sumMacros, type EntryWithFood } from '../lib/nutrition';
import { mealLabel, useT } from '../i18n';
import { AddEntryDialog } from './AddEntryDialog';
import { AmountStepper } from './AmountStepper';
import { useToast } from './Toast';

interface Props {
  date: string;
  mealType: MealType;
  entries: EntryWithFood[];
}

export function MealSlot({ date, mealType, entries }: Props) {
  const t = useT();
  const [adding, setAdding] = useState(false);
  // Standardmässig eingeklappt: nur Titel, kcal und "+ Add" sichtbar.
  const [expanded, setExpanded] = useState(false);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const totals = sumMacros(entries.map((e) => e.macros));
  const hasEntries = entries.length > 0;
  const listId = `meal-list-${mealType}`;
  const toast = useToast();
  const sources = useCopySources(date);
  const yesterday = sources?.find((s) => s.date === addDays(date, -1) && s.meal_type === mealType);
  const label = mealLabel(mealType);

  return (
    <section className="card meal" aria-labelledby={`meal-${mealType}`}>
      <header className="meal-header">
        <button
          className="meal-toggle"
          onClick={() => hasEntries && setExpanded((v) => !v)}
          aria-expanded={hasEntries ? expanded : undefined}
          aria-controls={hasEntries ? listId : undefined}
          disabled={!hasEntries}
        >
          <h2 id={`meal-${mealType}`}>{label}</h2>
          {hasEntries && (
            <span className="meal-meta">
              {entries.length} {entries.length === 1 ? t('common.item') : t('common.items')} · {t('macro.p')} {fmt(totals.protein)} · {t('macro.f')} {fmt(totals.fat)} · {t('macro.c')} {fmt(totals.carbs)}
            </span>
          )}
        </button>
        <div className="meal-header-right">
          <span className="meal-kcal">{fmt(totals.kcal)} kcal</span>
          <button className="btn-add" onClick={() => setAdding(true)} aria-label={t('slot.addTo', { meal: label })}>
            + {t('common.add')}
          </button>
          {hasEntries && (
            <button
              className={`btn-icon meal-chevron ${expanded ? 'open' : ''}`}
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? t('slot.collapse') : t('slot.expand')}
            >
              ›
            </button>
          )}
        </div>
      </header>

      {!hasEntries && yesterday && (
        <div className="meal-footer meal-footer-empty">
          <button
            className="btn-link"
            onClick={async () => {
              const n = await copyMeal(yesterday, date, mealType);
              toast.show({ message: t('slot.copied', { n }) });
            }}
          >
            {t('slot.copyYesterday', {
              n: yesterday.entries.length,
              items: yesterday.entries.length === 1 ? t('common.item') : t('common.items'),
              kcal: fmt(yesterday.totals.kcal),
            })}
          </button>
        </div>
      )}

      {hasEntries && (
        <div className={`collapse ${expanded ? 'open' : ''}`} aria-hidden={!expanded}>
          <div className="collapse-inner">
            <ul className="entry-list" id={listId}>
              {entries.map((e) => (
                <EntryRow key={e.entry.id} item={e} />
              ))}
            </ul>
            <div className="meal-footer">
              {templateName === null ? (
                <button className="btn-link" onClick={() => setTemplateName(t('slot.templateDefault', { meal: label }))}>
                  {t('slot.saveTemplate')}
                </button>
              ) : (
                <form
                  className="template-form"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    const name = templateName.trim();
                    if (!name) return;
                    void saveTemplate(
                      name,
                      entries.map((e) => ({ food_item_id: e.entry.food_item_id, amount: e.entry.amount, unit: e.entry.unit })),
                    );
                    setTemplateName(null);
                  }}
                >
                  <input
                    className="search-input"
                    value={templateName}
                    onChange={(ev) => setTemplateName(ev.target.value)}
                    placeholder={t('slot.templateName')}
                    aria-label={t('slot.templateName')}
                  />
                  <button type="submit" className="btn-primary" disabled={!templateName.trim()}>
                    {t('common.save')}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setTemplateName(null)}>
                    {t('common.cancel')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {adding && <AddEntryDialog date={date} mealType={mealType} onClose={() => setAdding(false)} />}
    </section>
  );
}

function EntryRow({ item }: { item: EntryWithFood }) {
  const t = useT();
  const { entry, food, macros } = item;
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(entry.amount));
  const toast = useToast();

  async function remove() {
    const snapshot = { ...entry };
    await deleteMealEntry(entry.id!);
    toast.show({
      message: t('slot.removed', { name: food.name }),
      actionLabel: t('common.undo'),
      onAction: async () => {
        await restoreMealEntry(snapshot);
      },
    });
  }

  function commit() {
    const n = Number(amount.replace(',', '.'));
    if (Number.isFinite(n) && n > 0 && n !== entry.amount) {
      void updateMealEntryAmount(entry.id!, n);
    } else {
      setAmount(String(entry.amount));
    }
    setEditing(false);
  }

  const unitLabel = entry.unit === 'Stück' ? t('unit.piece') : entry.unit;

  return (
    <li className="entry">
      <div className="entry-main">
        <span className="entry-name">
          {food.name}
          {food.brand && <span className="entry-brand"> · {food.brand}</span>}
        </span>
        <span className="entry-amount">
          {editing ? (
            <span className="entry-edit">
              <AmountStepper
                value={amount}
                onChange={setAmount}
                unit={entry.unit}
                compact
                autoFocus
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter') commit();
                  if (ev.key === 'Escape') {
                    setAmount(String(entry.amount));
                    setEditing(false);
                  }
                }}
              />
              <button type="button" className="btn-primary btn-sm" onClick={commit}>
                {t('common.ok')}
              </button>
            </span>
          ) : (
            <button className="btn-link" onClick={() => setEditing(true)} title={t('slot.changeAmount')}>
              {fmt(entry.amount, entry.amount % 1 === 0 ? 0 : 1)} {unitLabel}
            </button>
          )}
        </span>
      </div>
      <div className="entry-macros">
        <span className="entry-kcal">{fmt(macros.kcal)} kcal</span>
        <span>{t('macro.p')} {fmt(macros.protein)}</span>
        <span>{t('macro.f')} {fmt(macros.fat)}</span>
        <span>{t('macro.c')} {fmt(macros.carbs)}</span>
        <button className="btn-icon" onClick={() => void remove()} aria-label={t('slot.removeItem', { name: food.name })} title={t('common.remove')}>
          ×
        </button>
      </div>
    </li>
  );
}
