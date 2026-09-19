import { useState, type FormEvent } from 'react';
import { db } from '../db/db';
import type { DailyGoal } from '../db/types';
import { saveSettings, useGoals, useSettings } from '../db/hooks';
import { todayISO } from '../lib/date';
import { fmt } from '../lib/nutrition';
import { targetsFor } from '../lib/goals';
import { Modal } from './Modal';

const WEEKDAYS = [
  { d: 1, label: 'Mo' },
  { d: 2, label: 'Di' },
  { d: 3, label: 'Mi' },
  { d: 4, label: 'Do' },
  { d: 5, label: 'Fr' },
  { d: 6, label: 'Sa' },
  { d: 0, label: 'So' },
];

export function GoalsView() {
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
    if (!confirm(`Phase „${g.phase_name}“ löschen?`)) return;
    await db.goals.delete(g.id!);
  }

  return (
    <div className="goals">
      <section className="card section">
        <h2>Standard-Trainingstage</h2>
        <p className="search-hint">Gilt als Vorgabe; im Tagebuch kannst du jeden Tag einzeln umschalten.</p>
        <div className="weekday-picker" role="group" aria-label="Trainingstage">
          {WEEKDAYS.map((w) => {
            const on = settings?.training_weekdays.includes(w.d) ?? false;
            return (
              <button
                key={w.d}
                className={`weekday ${on ? 'active' : ''}`}
                aria-pressed={on}
                onClick={() => toggleWeekday(w.d)}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card section">
        <div className="section-head">
          <h2>Phasen</h2>
          <button className="btn-primary" onClick={() => setEditing('new')}>
            + Neue Phase
          </button>
        </div>
        {goals.length === 0 && <p className="search-empty">Noch keine Phase angelegt.</p>}
        <ul className="phase-list">
          {goals.map((g) => {
            const active = g.start_date <= today && (!g.end_date || today <= g.end_date);
            const t = targetsFor(g, true);
            const r = targetsFor(g, false);
            return (
              <li key={g.id} className={`phase ${active ? 'phase-active' : ''}`}>
                <div className="phase-head">
                  <span className="phase-name">
                    {g.phase_name}
                    {active && <span className="badge">aktiv</span>}
                  </span>
                  <span className="phase-dates">
                    {formatDate(g.start_date)} – {g.end_date ? formatDate(g.end_date) : 'offen'}
                  </span>
                </div>
                <dl className="phase-values">
                  <div>
                    <dt>Trainingstag</dt>
                    <dd>{fmt(g.training_day_kcal)} kcal · KH ≈ {fmt(t.carbs)} g</dd>
                  </div>
                  <div>
                    <dt>Ruhetag</dt>
                    <dd>{fmt(g.rest_day_kcal)} kcal · KH ≈ {fmt(r.carbs)} g</dd>
                  </div>
                  <div>
                    <dt>Protein</dt>
                    <dd>mind. {fmt(g.protein_g)} g</dd>
                  </div>
                  <div>
                    <dt>Fett</dt>
                    <dd>{fmt(g.fat_min_g)}–{fmt(g.fat_max_g)} g</dd>
                  </div>
                </dl>
                <div className="db-item-actions">
                  <button className="btn-link" onClick={() => setEditing(g)}>
                    Bearbeiten
                  </button>
                  <button className="btn-link danger" onClick={() => void remove(g)}>
                    Löschen
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {editing && (
        <Modal title={editing === 'new' ? 'Neue Phase' : 'Phase bearbeiten'} onClose={() => setEditing(null)}>
          <GoalForm goal={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function GoalForm({ goal, onDone }: { goal?: DailyGoal; onDone: () => void }) {
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
    if (!name.trim()) return setError('Name fehlt.');
    if (end && end < start) return setError('Enddatum liegt vor dem Startdatum.');
    if (Number(fatMin) > Number(fatMax)) return setError('Fett-Minimum ist grösser als das Maximum.');
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

  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        <span>Name der Phase</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Aufbauphase" required />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Start</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        </label>
        <label className="field">
          <span>Ende (optional)</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span>kcal Trainingstag</span>
          <input type="number" inputMode="numeric" min={0} value={trainKcal} onChange={(e) => setTrainKcal(e.target.value)} required />
        </label>
        <label className="field">
          <span>kcal Ruhetag</span>
          <input type="number" inputMode="numeric" min={0} value={restKcal} onChange={(e) => setRestKcal(e.target.value)} required />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span>Protein mind. (g)</span>
          <input type="number" inputMode="numeric" min={0} value={protein} onChange={(e) => setProtein(e.target.value)} required />
        </label>
        <label className="field">
          <span>Fett min (g)</span>
          <input type="number" inputMode="numeric" min={0} value={fatMin} onChange={(e) => setFatMin(e.target.value)} required />
        </label>
        <label className="field">
          <span>Fett max (g)</span>
          <input type="number" inputMode="numeric" min={0} value={fatMax} onChange={(e) => setFatMax(e.target.value)} required />
        </label>
      </div>
      <p className="search-hint">
        Kohlenhydrate ergeben sich aus dem Rest: Trainingstag ≈ {fmt(preview.carbs)} g.
      </p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onDone}>
          Abbrechen
        </button>
        <button type="submit" className="btn-primary">
          {goal ? 'Speichern' : 'Anlegen'}
        </button>
      </div>
    </form>
  );
}
