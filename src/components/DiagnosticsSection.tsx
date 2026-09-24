import { useState, useSyncExternalStore } from 'react';
import { isNative } from '../lib/native';
import { lastWidgetSync, syncWidgets } from '../lib/widgets';
import { clearErrors, formatErrorsForShare, readErrors, subscribeErrors } from '../lib/errorLog';
import { getLocale, useT } from '../i18n';
import { CollapsibleCard } from './CollapsibleCard';

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
    <CollapsibleCard title={t('diag.title')} summary={errors.length === 0 ? t('diag.none') : t('diag.count', { n: errors.length })}>
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
    </CollapsibleCard>
  );
}
