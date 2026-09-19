import { useScrollLock } from '../lib/useScrollLock';
import { useEffect, useState } from 'react';
import type { MealType } from '../db/types';
import { mealLabel, useT } from '../i18n';
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
  const t = useT();
  const [tab, setTab] = useState<Tab>('search');
  useScrollLock();

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'search', label: t('add.tabSearch') },
    { id: 'scan', label: t('add.tabScan') },
    { id: 'templates', label: t('add.tabTemplates') },
    { id: 'manual', label: t('add.tabManual') },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-entry-title" onClick={(ev) => ev.stopPropagation()}>
        <header className="modal-header">
          <h3 id="add-entry-title">{t('add.title', { meal: mealLabel(mealType) })}</h3>
          <button className="btn-icon" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </header>
        <div className="tabs" role="tablist">
          {tabs.map((tb) => (
            <button key={tb.id} role="tab" aria-selected={tab === tb.id} className={tab === tb.id ? 'active' : ''} onClick={() => setTab(tb.id)}>
              {tb.label}
            </button>
          ))}
        </div>
        {tab === 'search' && <FoodSearch date={date} mealType={mealType} onAdded={onClose} />}
        {tab === 'scan' && <ScanTab date={date} mealType={mealType} onDone={onClose} />}
        {tab === 'templates' && <TemplatesTab date={date} mealType={mealType} onDone={onClose} />}
        {tab === 'manual' && <ManualEntryForm date={date} mealType={mealType} onDone={onClose} />}
      </div>
    </div>
  );
}
