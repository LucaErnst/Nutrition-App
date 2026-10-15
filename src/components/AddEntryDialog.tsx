import { useScrollLock } from '../lib/useScrollLock';
import { useEffect, useRef, useState } from 'react';
import type { MealType } from '../db/types';
import { mealLabel, useT } from '../i18n';
import { ManualEntryForm } from './ManualEntryForm';
import { FoodSearch } from './FoodSearch';
import { ScanTab } from './ScanTab';
import { TemplatesTab } from './TemplatesTab';
import { usePro } from '../lib/pro';
import { openPaywall } from './Paywall';
import { warmLocalProducts } from '../lib/offLocal';

interface Props {
  date: string;
  mealType: MealType;
  onClose: () => void;
}

type Tab = 'search' | 'scan' | 'templates' | 'manual';

export function AddEntryDialog({ date, mealType, onClose }: Props) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('search');
  const pro = usePro();
  useScrollLock();

  // Mitgelieferte Produkte vorladen, bevor jemand tippt oder scannt.
  useEffect(() => warmLocalProducts(), []);

  // Griff, Titel, Reiter und Suchfeld stehen oben fest; das Suchfeld klebt direkt unter dem
  // festen Block. Dessen Höhe hängt von Schrift und Gerät ab, darum gemessen statt geschätzt.
  const modalRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const top = topRef.current;
    const modal = modalRef.current;
    if (!top || !modal) return;
    const update = () => modal.style.setProperty('--sheet-top-h', `${top.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(top);
    return () => ro.disconnect();
  }, []);

  // Nach unten wegziehen wie ein iOS-Sheet: Der feste Block oben folgt dem Finger, ab 120 px
  // oder bei schnellem Wischen schliesst das Fenster, sonst federt es zurück. Erst ab 6 px
  // Bewegung zählt es als Ziehen – ein Tipp auf einen Reiter oder das × bleibt ein Tipp.
  const drag = useRef<{ id: number; y0: number; t0: number; dy: number; active: boolean } | null>(null);
  function setOffset(dy: number, animate: boolean) {
    const modal = modalRef.current;
    const backdrop = backdropRef.current;
    if (!modal || !backdrop) return;
    modal.style.transition = animate ? 'transform 0.22s ease-out' : 'none';
    backdrop.style.transition = animate ? 'background-color 0.22s ease-out' : 'none';
    modal.style.transform = dy ? `translateY(${dy}px)` : '';
    backdrop.style.backgroundColor = dy ? `rgb(0 0 0 / ${Math.max(0, 0.45 * (1 - dy / 500))})` : '';
  }
  function onPointerDown(ev: React.PointerEvent) {
    drag.current = { id: ev.pointerId, y0: ev.clientY, t0: performance.now(), dy: 0, active: false };
  }
  function onPointerMove(ev: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== ev.pointerId) return;
    const dy = Math.max(0, ev.clientY - d.y0);
    if (!d.active && dy > 6) {
      d.active = true;
      (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    }
    if (d.active) {
      d.dy = dy;
      setOffset(dy, false);
    }
  }
  function onPointerUp(ev: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.active) return;
    ev.preventDefault();
    const velocity = d.dy / Math.max(1, performance.now() - d.t0);
    if (d.dy > 120 || velocity > 0.6) {
      setOffset(window.innerHeight, true);
      window.setTimeout(onClose, 200);
    } else {
      setOffset(0, true);
    }
  }

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
    <div ref={backdropRef} className="modal-backdrop" onClick={onClose}>
      <div ref={modalRef} className="modal sheet" role="dialog" aria-modal="true" aria-labelledby="add-entry-title" onClick={(ev) => ev.stopPropagation()}>
        <div
          ref={topRef}
          className="sheet-top"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="sheet-grabber" aria-hidden="true" />
          <header className="modal-header">
            <h3 id="add-entry-title">{t('add.title', { meal: mealLabel(mealType) })}</h3>
            <button className="btn-icon" onClick={onClose} aria-label={t('common.close')}>
              ×
            </button>
          </header>
          <div className="tabs" role="tablist">
            {tabs.map((tb) => (
              <button key={tb.id} role="tab" aria-selected={tab === tb.id} className={tab === tb.id ? 'active' : ''} onClick={() => (tb.id === 'templates' && !pro ? openPaywall() : setTab(tb.id))}>
                {tb.label}
              </button>
            ))}
          </div>
        </div>
        {tab === 'search' && <FoodSearch date={date} mealType={mealType} onAdded={onClose} />}
        {tab === 'scan' && <ScanTab date={date} mealType={mealType} onDone={onClose} />}
        {tab === 'templates' && <TemplatesTab date={date} mealType={mealType} onDone={onClose} />}
        {tab === 'manual' && <ManualEntryForm date={date} mealType={mealType} onDone={onClose} />}
      </div>
    </div>
  );
}
