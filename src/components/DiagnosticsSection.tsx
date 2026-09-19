import { useSyncExternalStore } from 'react';
import { clearErrors, formatErrorsForShare, readErrors, subscribeErrors } from '../lib/errorLog';

let cache = readErrors();
function getSnapshot() {
  return cache;
}
function subscribe(fn: () => void) {
  return subscribeErrors(() => {
    cache = readErrors();
    fn();
  });
}

export function DiagnosticsSection() {
  const errors = useSyncExternalStore(subscribe, getSnapshot);

  async function share() {
    const text = formatErrorsForShare(errors);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ernährung – Fehlerprotokoll', text });
        return;
      } catch {
        /* abgebrochen → Zwischenablage versuchen */
      }
    }
    await navigator.clipboard?.writeText(text);
  }

  return (
    <section className="card section">
      <h2>Diagnose</h2>
      <p className="search-hint">
        {errors.length === 0
          ? 'Keine Fehler protokolliert.'
          : `${errors.length} Fehler protokolliert (max. 20, nur auf diesem Gerät).`}
      </p>
      {errors.length > 0 && (
        <>
          <ul className="error-list">
            {errors.slice(0, 5).map((e, i) => (
              <li key={i}>
                <span className="error-time">
                  {new Date(e.at).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })} · v{e.version}
                </span>
                <span className="error-msg">{e.message}</span>
              </li>
            ))}
          </ul>
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn-secondary" onClick={() => void share()}>
              Protokoll teilen / kopieren
            </button>
            <button className="btn-link danger" onClick={clearErrors}>
              Löschen
            </button>
          </div>
        </>
      )}
    </section>
  );
}
