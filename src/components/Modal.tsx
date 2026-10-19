import { useScrollLock } from '../lib/useScrollLock';
import type React from 'react';
import { useEffect, useRef, type ReactNode } from 'react';
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
  const modalRef = useRef<HTMLDivElement>(null);
  // Sheet: am Griff oder Kopf nach unten ziehen schliesst (wie das Eintragen-Sheet und iOS).
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  const dragHandlers = sheet
    ? {
        onPointerDown: (ev: React.PointerEvent<HTMLDivElement>) => {
          if ((ev.target as HTMLElement).closest('button, input, select, textarea, a')) return;
          drag.current = { y: ev.clientY, t: performance.now(), dy: 0 };
          ev.currentTarget.setPointerCapture(ev.pointerId);
          if (modalRef.current) modalRef.current.style.transition = 'none';
        },
        onPointerMove: (ev: React.PointerEvent<HTMLDivElement>) => {
          const d = drag.current;
          if (!d || !modalRef.current) return;
          d.dy = Math.max(0, ev.clientY - d.y);
          modalRef.current.style.transform = `translateY(${d.dy}px)`;
        },
        onPointerUp: () => {
          const d = drag.current;
          drag.current = null;
          const m = modalRef.current;
          if (!d || !m) return;
          const v = d.dy / Math.max(1, performance.now() - d.t);
          m.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
          if (d.dy > 120 || v > 0.6) {
            m.style.transform = 'translateY(100%)';
            window.setTimeout(onClose, 200);
          } else m.style.transform = '';
        },
      }
    : {};

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={modalRef} className={`modal ${sheet ? 'sheet modal-sheet' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={(ev) => ev.stopPropagation()}>
        <div className={sheet ? 'sheet-drag' : undefined} {...dragHandlers}>
          {sheet && <div className="sheet-grabber" aria-hidden="true" />}
          <header className="modal-header">
            <h3>{title}</h3>
            <button className="btn-icon" onClick={onClose} aria-label={t('common.close')}>
              ×
            </button>
          </header>
        </div>
        {children}
      </div>
    </div>
  );
}
