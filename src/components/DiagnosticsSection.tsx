import { useState, useSyncExternalStore } from 'react';
import { isNative } from '../lib/native';
import { lastWidgetSync, syncWidgets } from '../lib/widgets';
import { clearErrors, formatErrorsForShare, readErrors, subscribeErrors } from '../lib/errorLog';
import { getLocale, useT } from '../i18n';

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
  const t = useT();
  const errors = useSyncExternalStore(subscribe, getSnapshot);
  const [widgetInfo, setWidgetInfo] = useState(() => lastWidgetSync());
  // Eingeklappt: die Diagnose ist ein Werkzeug für den Fehlerfall, kein täglicher Inhalt.
  const [open, setOpen] = useState(false);

  async function refreshWidgets() {
    await syncWidgets();
    setWidgetInfo(lastWidgetSync());
  }

  async function share() {
    const text = formatErrorsForShare(errors);
    if (navigator.share) {
      try {
        await navigator.share({ title: t('diag.shareTitle'), text });
        return;
      } catch {
        /* abgebrochen → Zwischenablage versuchen */
      }
    }
    await navigator.clipboard?.writeText(text);
  }

  return (
    <section className="card section">
      <div className="section-head">
        <h2>{t('diag.title')}</h2>
        <div className="meal-header-right">
          <button
            className={`btn-icon meal-chevron ${open ? 'open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t('slot.collapse') : t('slot.expand')}
          >
            ›
          </button>
        </div>
      </div>
      <p className="search-hint">
        {errors.length === 0 ? t('diag.none') : t('diag.count', { n: errors.length })}
      </p>

      <div className={`collapse ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="collapse-inner">
      {isNative && (
        <p className="search-hint" style={{ wordBreak: 'break-all' }}>
          Widgets: {widgetInfo ? `${new Date(widgetInfo.at).toLocaleTimeString(getLocale())} · stored=${String(widgetInfo.stored)} · ${widgetInfo.bytes ?? '?'} B · kcal ${widgetInfo.snap?.kcal}/${widgetInfo.snap?.kcalTarget ?? '–'}` : 'noch kein Sync'}{' '}
          <button className="btn-link" onClick={() => void refreshWidgets()}>Sync</button>
        </p>
      )}
      {errors.length > 0 && (
        <>
          <ul className="error-list">
            {errors.slice(0, 5).map((e, i) => (
              <li key={i}>
                <span className="error-time">
                  {new Date(e.at).toLocaleString(getLocale(), { dateStyle: 'short', timeStyle: 'short' })} · v{e.version}
                </span>
                <span className="error-msg">{e.message}</span>
              </li>
            ))}
          </ul>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => void share()}>
              {t('diag.share')}
            </button>
            <button className="btn-link danger" onClick={clearErrors}>
              {t('common.delete')}
            </button>
          </div>
        </>
      )}
        </div>
      </div>
    </section>
  );
}
