import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../i18n';

/** Zeigt an, wenn der Service Worker eine neue Version geladen hat. */
export function UpdateBanner() {
  const t = useT();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Regelmässig nach Updates schauen, auch wenn die App lange offen bleibt
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="banner banner-update" role="status">
      <span>{t('update.available')}</span>
      <div className="banner-actions">
        <button className="btn-link" onClick={() => setNeedRefresh(false)}>
          {t('common.later')}
        </button>
        <button className="btn-primary" onClick={() => void updateServiceWorker(true)}>
          {t('update.reload')}
        </button>
      </div>
    </div>
  );
}
