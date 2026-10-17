/** Schluckt den Klick, den der Browser am Ende eines Wischens auslöst – aber nur kurz. */
export function swallowNextClick(target: EventTarget) {
  const kill = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };
  target.addEventListener('click', kill, { capture: true, once: true });
  window.setTimeout(() => target.removeEventListener('click', kill, { capture: true }), 350);
}
