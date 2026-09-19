import { useState, type FormEvent } from 'react';
import { db } from '../db/db';
import type { DailyGoal } from '../db/types';
import { saveSettings, useGoals, useSettings } from '../db/hooks';
import { formatDate, todayISO } from '../lib/date';
import { fmt } from '../lib/nutrition';
import { targetsFor } from '../lib/goals';
import { getLocale, useT } from '../i18n';
import { Modal } from './Modal';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

function weekdayName(d: number): string {
  // 2026-09-06 ist ein Sonntag → d Tage addieren
  return new Date(2026, 8, 6 + d).toLocaleDateString(getLocale(), { weekday: 'short' }).replace('.', '');
}

export function GoalsView() {
  const t = useT();
  const goals = useGoals() ?? [];
  const settings = useSettings();
  const [editing, setEditing] = useState<DailyGoal | 'new' | null>(null);
  const today = todayISO();

  function toggleWeekday(d: number) {
    if (!settings) return;
    const set = new Set(settings.training_weekdays);
    if (set.has(d)) set.delete(d);
    else set.add(d);
    void saveSettings({ training_weekdays: [...set] });
  }

  async function remove(g: DailyGoal) {
    if (!confirm(t('goals.confirmDelete', { name: g.phase_name }))) return;
    await db.goals.delete(g.id!);
  }

  return (
    <div className="goals">
      <section className="card section">
        <h2>{t('goals.trainingDays')}</h2>
        <p className="search-hint">{t('goals.trainingDaysHint')}</p>
        <div className="weekday-picker" role="group" aria-label={t('goals.trainingDaysLabel')}>
          {WEEKDAYS.map((d) => {
            const on = settings?.training_weekdays.includes(d) ?? false;
            return (
              <button key={d} className={`weekday ${on ? 'active' : ''}`} aria-pressed={on} onClick={() => toggleWeekday(d)}>
                {weekdayName(d)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card section">
        <div className="section-head">
          <h2>{t('goals.phases')}</h2>
          <button className="btn-primary" onClick={() => setEditing('new')}>
            {t('goals.newPhase')}
          </button>
        </div>
        {goals.length === 0 && <p className="search-empty">{t('goals.none')}</p>}
        <ul className="phase-list">
          {goals.map((g) => {
            const active = g.start_date <= today && (!g.end_date || today <= g.end_date);
            const tr = targetsFor(g, true);
            const r = targetsFor(g, false);
            return (
              <li key={g.id} className={`phase ${active ? 'phase-active' : ''}`}>
                <div className="phase-head">
                  <span className="phase-name">
                    {g.phase_name}
                    {active && <span className="badge">{t('goals.active')}</span>}
                  </span>
                  <span className="phase-dates">
                    {formatDate(g.start_date)} – {g.end_date ? formatDate(g.end_date) : t('goals.open')}
                  </span>
                </div>
                <dl className="phase-values">
                  <div>
                    <dt>{t('goals.trainingDay')}</dt>
                    <dd>
                      {fmt(g.training_day_kcal)} kcal · {t('goals.carbsApprox', { n: fmt(tr.carbs) })}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('goals.restDay')}</dt>
                    <dd>
                      {fmt(g.rest_day_kcal)} kcal · {t('goals.carbsApprox', { n: fmt(r.carbs) })}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('macro.protein')}</dt>
                    <dd>{t('goals.proteinMin', { n: fmt(g.protein_g) })}</dd>
                  </div>
                  <div>
                    <dt>{t('macro.fat')}</dt>
                    <dd>
                      {fmt(g.fat_min_g)}–{fmt(g.fat_max_g)} g
                    </dd>
                  </div>
                </dl>
                <div className="db-item-actions">
                  <button className="btn-link" onClick={() => setEditing(g)}>
                    {t('common.edit')}
                  </button>
                  <button className="btn-link danger" onClick={() => void remove(g)}>
                    {t('common.delete')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {editing && (
        <Modal title={editing === 'new' ? t('goals.newTitle') : t('goals.editTitle')} onClose={() => setEditing(null)}>
          <GoalForm goal={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

function GoalForm({ goal, onDone }: { goal?: DailyGoal; onDone: () => void }) {
  const t = useT();
  const [name, setName] = useState(goal?.phase_name ?? '');
  const [start, setStart] = useState(goal?.start_date ?? todayISO());
  const [end, setEnd] = useState(goal?.end_date ?? '');
  const [trainKcal, setTrainKcal] = useState(String(goal?.training_day_kcal ?? 2700));
  const [restKcal, setRestKcal] = useState(String(goal?.rest_day_kcal ?? 2350));
  const [protein, setProtein] = useState(String(goal?.protein_g ?? 150));
  const [fatMin, setFatMin] = useState(String(goal?.fat_min_g ?? 75));
  const [fatMax, setFatMax] = useState(String(goal?.fat_max_g ?? 90));
  const [error, setError] = useState<string | null>(null);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!name.trim()) return setError(t('goals.errName'));
    if (end && end < start) return setError(t('goals.errDates'));
    if (Number(fatMin) > Number(fatMax)) return setError(t('goals.errFat'));
    const data: Omit<DailyGoal, 'id'> = {
      phase_name: name.trim(),
      start_date: start,
      end_date: end || undefined,
      training_day_kcal: Number(trainKcal),
      rest_day_kcal: Number(restKcal),
      protein_g: Number(protein),
      fat_min_g: Number(fatMin),
      fat_max_g: Number(fatMax),
    };
    if (goal?.id) await db.goals.update(goal.id, data);
    else await db.goals.add(data);
    onDone();
  }

  const preview = targetsFor(
    { phase_name: '', start_date: '', training_day_kcal: Number(trainKcal), rest_day_kcal: Number(restKcal), protein_g: Number(protein), fat_min_g: Number(fatMin), fat_max_g: Number(fatMax) },
    true,
  );
  const numField = (label: string, value: string, set: (v: string) => void) => (
    <label className="field">
      <span>{label}</span>
      <input type="number" inputMode="numeric" min={0} value={value} onChange={(e) => set(e.target.value)} required />
    </label>
  );

  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        <span>{t('goals.phaseName')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('goals.phasePlaceholder')} required />
      </label>
      <div className="field-row">
        <label className="field">
          <span>{t('goals.start')}</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        </label>
        <label className="field">
          <span>{t('goals.end')}</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      <div className="field-row">
        {numField(t('goals.kcalTraining'), trainKcal, setTrainKcal)}
        {numField(t('goals.kcalRest'), restKcal, setRestKcal)}
      </div>
      <div className="field-row">
        {numField(t('goals.proteinMinG'), protein, setProtein)}
        {numField(t('goals.fatMin'), fatMin, setFatMin)}
        {numField(t('goals.fatMax'), fatMax, setFatMax)}
      </div>
      <p className="search-hint">{t('goals.carbsHint', { n: fmt(preview.carbs) })}</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onDone}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn-primary">
          {goal ? t('common.save') : t('common.create')}
        </button>
      </div>
    </form>
  );
}
