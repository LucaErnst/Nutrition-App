import { useEffect } from 'react';

/**
 * Friert das Scrollen der Seite ein, solange ein Dialog offen ist, und stellt
 * die Scroll-Position danach wieder her. Verhindert vor allem auf iOS, dass die
 * Tastatur die Seite hinter dem Dialog nach unten schiebt.
 */
export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
