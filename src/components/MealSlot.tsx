import { useState } from 'react';
import { MEAL_LABELS, type MealType } from '../db/types';
import { copyMeal, deleteMealEntry, restoreMealEntry, saveTemplate, updateMealEntryAmount, useCopySources } from '../db/hooks';
import { addDays } from '../lib/date';
import { useToast } from './Toast';
import { AmountStepper } from './AmountStepper';
import { fmt, sumMacros, type EntryWithFood } from '../lib/nutrition';
import { AddEntryDialog } from './AddEntryDialog';

interface Props {
  date: string;
  mealType: MealType;
  entries: EntryWithFood[];
}

export function MealSlot({ date, mealType, entries }: Props) {
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
          <h2 id={`meal-${mealType}`}>{MEAL_LABELS[mealType]}</h2>
          {hasEntries && (
            <span className="meal-meta">
              {entries.length} {entries.length === 1 ? 'Posten' : 'Posten'} · P {fmt(totals.protein)} · F {fmt(totals.fat)} · KH {fmt(totals.carbs)}
            </span>
          )}
        </button>
        <div className="meal-header-right">
          <span className="meal-kcal">{fmt(totals.kcal)} kcal</span>
          <button className="btn-add" onClick={() => setAdding(true)} aria-label={`Posten zu ${MEAL_LABELS[mealType]} hinzufügen`}>
            + Add
          </button>
          {hasEntries && (
            <button
              className={`btn-icon meal-chevron ${expanded ? 'open' : ''}`}
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'Einklappen' : 'Ausklappen'}
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
              toast.show({ message: `${n} Posten von gestern kopiert.` });
            }}
          >
            Von gestern kopieren ({yesterday.entries.length} Posten · {fmt(yesterday.totals.kcal)} kcal)
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
              <button className="btn-link" onClick={() => setTemplateName(`${MEAL_LABELS[mealType]}-Standard`)}>
                Als Vorlage speichern
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
                  placeholder="Name der Vorlage"
                  aria-label="Name der Vorlage"
                />
                <button type="submit" className="btn-primary" disabled={!templateName.trim()}>
                  Speichern
                </button>
                <button type="button" className="btn-secondary" onClick={() => setTemplateName(null)}>
                  Abbrechen
                </button>
              </form>
            )}
          </div>
        </div>
        </div>
      )}

      {adding && (
        <AddEntryDialog date={date} mealType={mealType} onClose={() => setAdding(false)} />
      )}
    </section>
  );
}

function EntryRow({ item }: { item: EntryWithFood }) {
  const { entry, food, macros } = item;
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(entry.amount));
  const toast = useToast();

  async function remove() {
    const snapshot = { ...entry };
    await deleteMealEntry(entry.id!);
    toast.show({
      message: `${food.name} entfernt.`,
      actionLabel: 'Rückgängig',
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
                OK
              </button>
            </span>
          ) : (
            <button className="btn-link" onClick={() => setEditing(true)} title="Menge ändern">
              {fmt(entry.amount, entry.amount % 1 === 0 ? 0 : 1)} {entry.unit}
            </button>
          )}
        </span>
      </div>
      <div className="entry-macros">
        <span className="entry-kcal">{fmt(macros.kcal)} kcal</span>
        <span>P {fmt(macros.protein)}</span>
        <span>F {fmt(macros.fat)}</span>
        <span>KH {fmt(macros.carbs)}</span>
        <button
          className="btn-icon"
          onClick={() => void remove()}
          aria-label={`${food.name} entfernen`}
          title="Entfernen"
        >
          ×
        </button>
      </div>
    </li>
  );
}
