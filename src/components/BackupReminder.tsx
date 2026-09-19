import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../db/hooks';
import { exportBackup } from '../lib/backup';
import { useT } from '../i18n';

const REMIND_AFTER_DAYS = 14;
const SNOOZE_KEY = 'nutrition-tracker:backup-snooze-until';

/** Erinnert im Tagebuch an ein Backup, wenn das letzte länger als 14 Tage her ist. */
export function BackupReminder() {
  const t = useT();
  const settings = useSettings();
  const entryCount = useLiveQuery(() => db.mealEntries.count());
  const [snoozed, setSnoozed] = useState(() => {
    try {
      return Number(localStorage.getItem(SNOOZE_KEY) ?? 0) > Date.now();
    } catch {
      return false;
    }
  });
  const [busy, setBusy] = useState(false);

  if (!settings || !entryCount || snoozed) return null;
  const last = settings.last_backup_at;
  const days = last ? Math.floor((Date.now() - last) / 86_400_000) : undefined;
  if (days !== undefined && days < REMIND_AFTER_DAYS) return null;

  async function backupNow() {
    setBusy(true);
    try {
      await exportBackup();
    } catch {
      /* Abbruch im Share-Sheet – Banner bleibt */
    } finally {
      setBusy(false);
    }
  }

  function snooze() {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + 3 * 86_400_000));
    } catch {
      /* ignorieren */
    }
    setSnoozed(true);
  }

  return (
    <div className="banner" role="status">
      <span>
        {days === undefined ? t('reminder.none') : t('reminder.old', { n: days })} {t('reminder.local')}
      </span>
      <div className="banner-actions">
        <button className="btn-link" onClick={snooze}>
          {t('common.later')}
        </button>
        <button className="btn-primary" onClick={() => void backupNow()} disabled={busy}>
          {t('reminder.now')}
        </button>
      </div>
    </div>
  );
}
