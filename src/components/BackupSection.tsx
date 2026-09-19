import { useRef, useState } from 'react';
import { exportBackup, parseBackup, restoreBackup, type Backup } from '../lib/backup';
import { useSettings } from '../db/hooks';
import { getLocale, useT } from '../i18n';

export function BackupSection() {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [busy, setBusy] = useState(false);
  const settings = useSettings();

  async function doExport() {
    setMessage(null);
    setBusy(true);
    try {
      const how = await exportBackup();
      setMessage({ kind: 'ok', text: how === 'shared' ? t('backup.shared') : t('backup.downloaded') });
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) {
        setMessage({ kind: 'error', text: t('backup.exportFailed') });
      }
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    setMessage(null);
    if (!file) return;
    try {
      const b = parseBackup(await file.text());
      setPending(b);
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : t('backup.readFailed') });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function doRestore() {
    if (!pending) return;
    setBusy(true);
    try {
      await restoreBackup(pending);
      setMessage({ kind: 'ok', text: t('backup.restored') });
      setPending(null);
    } catch {
      setMessage({ kind: 'error', text: t('backup.restoreFailed') });
    } finally {
      setBusy(false);
    }
  }

  function formatWhen(iso: string | number): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return t('backup.unknownDate');
    return d.toLocaleString(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <section className="card section">
      <h2>{t('backup.title')}</h2>
      <p className="search-hint">{t('backup.hint')}</p>
      <p className="search-hint">{t('backup.last', { when: settings?.last_backup_at ? formatWhen(settings.last_backup_at) : t('backup.never') })}</p>
      <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
        <button className="btn-primary" onClick={() => void doExport()} disabled={busy}>
          {t('backup.export')}
        </button>
        <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
          {t('backup.import')}
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>

      {pending && (
        <div className="scan-notice" style={{ marginTop: 12 }}>
          <p>
            {t('backup.pending', {
              when: formatWhen(pending.exported_at),
              entries: pending.mealEntries.length,
              foods: pending.foodItems.length,
              weights: pending.weights.length,
              goals: pending.goals.length,
              templates: pending.templates.length,
            })}
          </p>
          <p className="form-error">{t('backup.warning')}</p>
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn-secondary" onClick={() => setPending(null)} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button className="btn-primary" onClick={() => void doRestore()} disabled={busy}>
              {t('backup.restore')}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={message.kind === 'error' ? 'form-error' : 'form-ok'} role="status" style={{ marginTop: 10 }}>
          {message.text}
        </p>
      )}
    </section>
  );
}
