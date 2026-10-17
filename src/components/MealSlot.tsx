import { useState } from 'react';
import type { MealType } from '../db/types';
import { usePro } from '../lib/pro';
import { openPaywall, ProBadge } from './Paywall';
import { copyMeal, deleteMealEntry, restoreMealEntry, saveTemplate, updateMealEntryAmount, useCopySources, useUnitSystem } from '../db/hooks';
import { addDays } from '../lib/date';
import { fmt, sumMacros, type EntryWithFood } from '../lib/nutrition';
import { mealLabel, useT } from '../i18n';
import { fmtAmount, isPieceUnit, labelFor } from '../lib/units';
import { AddEntryDialog } from './AddEntryDialog';
import { AmountStepper } from './AmountStepper';
import { useToast } from './Toast';
import { Tip } from './Tip';
import { SwipeRow } from './SwipeRow';

interface Props {
  date: string;
  mealType: MealType;
  entries: EntryWithFood[];
}

export function MealSlot({ date, mealType, entries }: Props) {
  const pro = usePro();
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
    <>
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
          {hasEntries ? (
            <button
              className={`btn-icon meal-chevron ${expanded ? 'open' : ''}`}
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? t('slot.collapse') : t('slot.expand')}
            >
              <svg viewBox="0 0 8 13" width="8" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1.5 1.5 6.5 6.5l-5 5" />
              </svg>
            </button>
          ) : (
            <span className="chevron-slot" aria-hidden="true" />
          )}
          <button className="btn-add btn-add-round" onClick={() => setAdding(true)} aria-label={t('slot.addTo', { meal: label })}>
            <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M7 1v12M1 7h12" />
            </svg>
          </button>
        </div>
      </header>

      {!hasEntries && yesterday && (
        <div className="meal-footer meal-footer-empty">
          <button
            className="btn-link"
            onClick={async () => {
              if (!pro) return openPaywall();
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
          {!pro && <ProBadge />}
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
                <button className="btn-link" onClick={() => (pro ? setTemplateName(t('slot.templateDefault', { meal: label })) : openPaywall())}>
                  {t('slot.saveTemplate')}
                  {!pro && <ProBadge />}
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
    {mealType === 'breakfast' && (
      <Tip id="template" when={entries.length >= 2}>
        {pro ? t('tip.template') : t('tip.templateFree')}
      </Tip>
    )}
    </>
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

  const unitLabel = labelFor(entry.unit, t('unit.piece'));
  // „3 Stück (150 g)": zeigt, womit gerechnet wird. Gramm nur im metrischen System.
  const system = useUnitSystem();
  const pieceGrams = isPieceUnit(entry.unit) && food.piece_weight_g && system === 'metric' ? entry.amount * food.piece_weight_g : 0;

  return (
    <SwipeRow className="entry" onDelete={() => void remove()} deleteLabel={t('slot.removeItem', { name: food.name })} actionText={t('common.delete')}>
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
              {fmtAmount(entry.amount, entry.unit)} {unitLabel}
              {pieceGrams > 0 && ` (${fmt(pieceGrams)} g)`}
            </button>
          )}
        </span>
      </div>
      <div className="entry-macros">
        <span className="entry-kcal">{fmt(macros.kcal)} kcal</span>
        <span>{t('macro.p')} {fmt(macros.protein)}</span>
        <span>{t('macro.f')} {fmt(macros.fat)}</span>
        <span>{t('macro.c')} {fmt(macros.carbs)}</span>
      </div>
    </SwipeRow>
  );
}
