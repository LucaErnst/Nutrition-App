import { useEffect, useState } from 'react';
import { saveSettings, useSettings } from '../db/hooks';
import { healthAvailable, healthBackfill, requestHealthAccess, setHealthEnabledCache } from '../lib/health';
import { isNative } from '../lib/native';
import { useT } from '../i18n';

/** Mehr → Apple Health: ein Schalter; beim Einschalten Freigabe + Erstabgleich. */
export function HealthSection() {
  const t = useT();
  const settings = useSettings();
  const enabled = !!settings?.health_enabled;
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (isNative) void healthAvailable().then(setAvailable);
  }, []);

  if (!isNative || !available) return null;

  async function toggle(on: boolean) {
    setNote(null);
    if (!on) {
      setHealthEnabledCache(false);
      await saveSettings({ health_enabled: false });
      setNote(t('health.off'));
      return;
    }
    setBusy(true);
    try {
      const ok = await requestHealthAccess();
      if (!ok) {
        setNote(t('health.denied'));
        return;
      }
      setHealthEnabledCache(true);
      await saveSettings({ health_enabled: true });
      await healthBackfill();
      setNote(t('health.done'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card section">
      <div className="section-head">
        <h2>{t('health.title')}</h2>
        <label className="checkbox">
          <input type="checkbox" checked={enabled} disabled={busy} onChange={(e) => void toggle(e.target.checked)} />
          {enabled ? t('rem.on') : t('rem.off')}
        </label>
      </div>
      <p className="search-hint">{busy ? t('health.syncing') : note ?? t('health.hint')}</p>
    </section>
  );
}
