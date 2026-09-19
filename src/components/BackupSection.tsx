import { useRef, useState } from 'react';
import { exportBackup, parseBackup, restoreBackup, type Backup } from '../lib/backup';
import { useSettings } from '../db/hooks';

export function BackupSection() {
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
      setMessage({ kind: 'ok', text: how === 'shared' ? 'Backup geteilt.' : 'Backup heruntergeladen.' });
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) {
        setMessage({ kind: 'error', text: 'Export fehlgeschlagen.' });
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
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Datei konnte nicht gelesen werden.' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function doRestore() {
    if (!pending) return;
    setBusy(true);
    try {
      await restoreBackup(pending);
      setMessage({ kind: 'ok', text: 'Backup wiederhergestellt.' });
      setPending(null);
    } catch {
      setMessage({ kind: 'error', text: 'Wiederherstellen fehlgeschlagen – bestehende Daten sind unverändert.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card section">
      <h2>Backup</h2>
      <p className="search-hint">
        Alle Daten liegen nur auf diesem Gerät. Exportiere regelmässig ein Backup (z.B. in iCloud Drive) – damit kannst du auch auf ein anderes Gerät umziehen.
      </p>
      <p className="search-hint">
        Letztes Backup:{' '}
        {settings?.last_backup_at
          ? new Date(settings.last_backup_at).toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' })
          : 'noch nie'}
      </p>
      <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
        <button className="btn-primary" onClick={() => void doExport()} disabled={busy}>
          Backup exportieren
        </button>
        <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
          Backup importieren…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>

      {pending && (
        <div className="scan-notice" style={{ marginTop: 12 }}>
          <p>
            <strong>Backup vom {formatExportDate(pending.exported_at)}</strong>: {pending.mealEntries.length} Posten,{' '}
            {pending.foodItems.length} Lebensmittel, {pending.weights.length} Gewichte, {pending.goals.length} Phasen,{' '}
            {pending.templates.length} Vorlagen.
          </p>
          <p className="form-error">Beim Wiederherstellen werden alle aktuellen Daten auf diesem Gerät ersetzt.</p>
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn-secondary" onClick={() => setPending(null)} disabled={busy}>
              Abbrechen
            </button>
            <button className="btn-primary" onClick={() => void doRestore()} disabled={busy}>
              Ersetzen und wiederherstellen
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

function formatExportDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unbekanntem Datum';
  return d.toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' });
}
