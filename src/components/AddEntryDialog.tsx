import { useEffect, useState } from 'react';
import { MEAL_LABELS, type MealType } from '../db/types';
import { ManualEntryForm } from './ManualEntryForm';
import { FoodSearch } from './FoodSearch';
import { ScanTab } from './ScanTab';
import { TemplatesTab } from './TemplatesTab';

interface Props {
  date: string;
  mealType: MealType;
  onClose: () => void;
}

type Tab = 'search' | 'scan' | 'templates' | 'manual';

export function AddEntryDialog({ date, mealType, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('search');

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-entry-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <header className="modal-header">
          <h3 id="add-entry-title">Posten zu {MEAL_LABELS[mealType]}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Schliessen">
            ×
          </button>
        </header>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'search'} className={tab === 'search' ? 'active' : ''} onClick={() => setTab('search')}>
            Suchen
          </button>
          <button role="tab" aria-selected={tab === 'scan'} className={tab === 'scan' ? 'active' : ''} onClick={() => setTab('scan')}>
            Scannen
          </button>
          <button role="tab" aria-selected={tab === 'templates'} className={tab === 'templates' ? 'active' : ''} onClick={() => setTab('templates')}>
            Vorlagen
          </button>
          <button role="tab" aria-selected={tab === 'manual'} className={tab === 'manual' ? 'active' : ''} onClick={() => setTab('manual')}>
            Manuell
          </button>
        </div>
        {tab === 'search' && <FoodSearch date={date} mealType={mealType} onAdded={onClose} />}
        {tab === 'scan' && <ScanTab date={date} mealType={mealType} onDone={onClose} />}
        {tab === 'templates' && <TemplatesTab date={date} mealType={mealType} onDone={onClose} />}
        {tab === 'manual' && <ManualEntryForm date={date} mealType={mealType} onDone={onClose} />}
      </div>
    </div>
  );
}
