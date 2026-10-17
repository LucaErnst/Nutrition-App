import { useScrollLock } from '../lib/useScrollLock';
import { useEffect, type ReactNode } from 'react';
import { useT } from '../i18n';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Von unten wie ein iOS-Sheet (mit Griff) statt als Dialog */
  sheet?: boolean;
}

export function Modal({ title, onClose, children, sheet }: Props) {
  const t = useT();
  useScrollLock();

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${sheet ? 'sheet modal-sheet' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={(ev) => ev.stopPropagation()}>
        {sheet && <div className="sheet-grabber" aria-hidden="true" />}
        <header className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
