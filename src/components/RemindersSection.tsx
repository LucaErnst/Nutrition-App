import { useEffect, useState } from 'react';
import { saveSettings, useSettings } from '../db/hooks';
import { useT } from '../i18n';
import { isNative } from '../lib/native';
import { DEFAULT_REMINDERS, MAX_PER_DAY, type ReminderSettings } from '../lib/reminders';
import { reminderPermission, requestReminderPermission, syncReminders } from '../lib/remindersNative';

/** Erinnerungen: Master-Schalter, Zeiten pro Anlass, Wasser-Takt. Nur native App. */
export function RemindersSection() {
  const t = useT();
  const settings = useSettings();
  const r: ReminderSettings = settings?.reminders ?? DEFAULT_REMINDERS;
  const [perm, setPerm] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [planned, setPlanned] = useState<number | null>(null);

  useEffect(() => {
    if (isNative) void reminderPermission().then(setPerm);
  }, []);

  async function update(patch: Partial<ReminderSettings>) {
    const next = { ...r, ...patch };
    await saveSettings({ reminders: next });
    if (next.enabled) setPlanned(await syncReminders());
    else await syncReminders();
  }

  async function toggleEnabled(on: boolean) {
    if (on) {
      const ok = perm === 'granted' || (await requestReminderPermission());
      setPerm(ok ? 'granted' : 'denied');
      if (!ok) return;
    }
    await update({ enabled: on });
  }

  if (!isNative) {
    return (
      <section className="card section">
        <h2>{t('rem.title')}</h2>
        <p className="search-hint">{t('rem.webHint')}</p>
      </section>
    );
  }

  const timeField = (label: string, value: string | null, onChange: (v: string | null) => void) => (
    <div className="rem-row">
      <label className="checkbox">
        <input type="checkbox" checked={value !== null} onChange={(e) => onChange(e.target.checked ? '08:00' : null)} />
        {label}
      </label>
      {value !== null && <input type="time" className="rem-time" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label={label} />}
    </div>
  );

  return (
    <section className="card section">
      <div className="section-head">
        <h2>{t('rem.title')}</h2>
        <label className="checkbox">
          <input type="checkbox" checked={r.enabled} onChange={(e) => void toggleEnabled(e.target.checked)} />
          {r.enabled ? t('rem.on') : t('rem.off')}
        </label>
      </div>
      <p className="search-hint">{t('rem.hint', { n: MAX_PER_DAY })}</p>
      {perm === 'denied' && <p className="form-error">{t('rem.denied')}</p>}

      {r.enabled && (
        <div className="rem-list">
          {timeField(t('rem.weigh'), r.weigh, (v) => void update({ weigh: v }))}
          {timeField(t('rem.breakfast'), r.breakfast, (v) => void update({ breakfast: v }))}
          {timeField(t('rem.lunch'), r.lunch, (v) => void update({ lunch: v }))}
          {timeField(t('rem.dinner'), r.dinner, (v) => void update({ dinner: v }))}
          <div className="rem-row">
            <label className="checkbox">
              <input type="checkbox" checked={r.protein} onChange={(e) => void update({ protein: e.target.checked })} />
              {t('rem.protein')}
            </label>
          </div>
          <div className="rem-row rem-water">
            <label className="checkbox">
              <input type="checkbox" checked={r.water !== null} onChange={(e) => void update({ water: e.target.checked ? DEFAULT_REMINDERS.water : null })} />
              {t('rem.water')}
            </label>
            {r.water && (
              <div className="rem-water-fields">
                <input type="time" className="rem-time" value={r.water.from} onChange={(e) => e.target.value && void update({ water: { ...r.water!, from: e.target.value } })} aria-label={t('rem.from')} />
                <span>–</span>
                <input type="time" className="rem-time" value={r.water.to} onChange={(e) => e.target.value && void update({ water: { ...r.water!, to: e.target.value } })} aria-label={t('rem.to')} />
                <select value={r.water.every_hours} onChange={(e) => void update({ water: { ...r.water!, every_hours: Number(e.target.value) } })} aria-label={t('rem.every')}>
                  {[1, 2, 3, 4].map((h) => (
                    <option key={h} value={h}>
                      {t('rem.everyHours', { n: h })}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {timeField(t('rem.weekly'), r.weekly, (v) => void update({ weekly: v }))}
          {planned !== null && <p className="search-hint">{t('rem.planned', { n: planned })}</p>}
        </div>
      )}
    </section>
  );
}
