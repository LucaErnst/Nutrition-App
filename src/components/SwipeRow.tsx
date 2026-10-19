import { useEffect, useRef, type ReactNode } from 'react';
import { swallowNextClick } from '../lib/swallowClick';

interface Props {
  children: ReactNode;
  /** Wird nach der Ausblend-Animation aufgerufen */
  onDelete: () => void;
  /** Vorlesetext des Lösch-Knopfs, z.B. „Magerquark entfernen“ */
  deleteLabel: string;
  /** Sichtbarer Text auf der roten Fläche */
  actionText: string;
  className?: string;
  /** Rückfrage vor dem Löschen; false lässt die Zeile zurückfedern */
  confirm?: () => boolean;
}

const ACTION_W = 88;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/**
 * Listenzeile wie in iOS: nach links wischen zeigt „Löschen“, weit wischen (über die halbe Breite)
 * löscht direkt. Senkrechtes Scrollen bleibt frei; erst eine klar waagrechte Bewegung greift.
 */
export function SwipeRow({ children, onDelete, deleteLabel, actionText, className = '', confirm }: Props) {
  const liRef = useRef<HTMLLIElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const actRef = useRef<HTMLButtonElement>(null);
  const pos = useRef(0);
  const drag = useRef<{ x: number; y: number; base: number; dir: 'x' | null; id: number } | null>(null);
  const removing = useRef(false);

  function setPos(x: number, animate: boolean) {
    pos.current = x;
    const row = rowRef.current;
    const act = actRef.current;
    if (!row || !act) return;
    const tr = animate ? `transform 0.3s ${EASE}, width 0.3s ${EASE}` : 'none';
    row.style.transition = tr;
    act.style.transition = tr;
    row.style.transform = x ? `translateX(${x}px)` : '';
    act.style.width = `${Math.max(ACTION_W, -x)}px`;
    liRef.current?.classList.toggle('swipe-open', x < 0);
  }

  function remove() {
    if (removing.current) return;
    if (confirm && !confirm()) {
      actRef.current?.classList.remove('armed');
      setPos(0, true);
      return;
    }
    removing.current = true;
    const li = liRef.current;
    if (!li) return onDelete();
    actRef.current?.classList.add('armed');
    setPos(-li.offsetWidth, true);
    window.setTimeout(() => {
      li.style.height = `${li.offsetHeight}px`;
      li.style.transition = `height 0.26s ${EASE}, opacity 0.26s`;
      requestAnimationFrame(() => {
        li.style.height = '0px';
        li.style.opacity = '0';
      });
      window.setTimeout(onDelete, 270);
    }, 200);
  }

  // Offene Zeile schliesst sich, sobald woanders getippt wird.
  useEffect(() => {
    function onDown(ev: PointerEvent) {
      if (pos.current < 0 && !liRef.current?.contains(ev.target as Node)) {
        actRef.current?.classList.remove('armed');
        setPos(0, true);
      }
    }
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  return (
    <li ref={liRef} className={`swipe ${className}`}>
      <button
        ref={actRef}
        type="button"
        className="swipe-action"
        aria-label={deleteLabel}
        onClick={remove}
        tabIndex={-1}
      >
        <span>{actionText}</span>
      </button>
      <div
        ref={rowRef}
        className="swipe-row"
        onPointerDown={(ev) => {
          if (removing.current || (ev.target as HTMLElement).closest('input, textarea, select')) return;
          drag.current = { x: ev.clientX, y: ev.clientY, base: pos.current, dir: null, id: ev.pointerId };
        }}
        onPointerMove={(ev) => {
          const d = drag.current;
          if (!d) return;
          const dx = ev.clientX - d.x;
          const dy = ev.clientY - d.y;
          if (!d.dir) {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
              d.dir = 'x';
              rowRef.current?.setPointerCapture(d.id);
            } else if (Math.abs(dy) > 8) {
              drag.current = null;
              return;
            } else return;
          }
          let x = d.base + dx;
          if (x > 0) x /= 4;
          setPos(x, false);
          actRef.current?.classList.toggle('armed', -x > (liRef.current?.offsetWidth ?? 400) * 0.55);
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (!d?.dir) return;
          // Der Klick nach einem Wisch soll nichts öffnen (z.B. die Menge bearbeiten).
          if (rowRef.current) swallowNextClick(rowRef.current);
          if (-pos.current > (liRef.current?.offsetWidth ?? 400) * 0.55) remove();
          else {
            actRef.current?.classList.remove('armed');
            setPos(pos.current < -ACTION_W / 2 ? -ACTION_W : 0, true);
          }
        }}
        onPointerCancel={() => {
          drag.current = null;
          setPos(0, true);
        }}
      >
        {children}
      </div>
    </li>
  );
}
