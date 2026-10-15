import { useState, type FormEvent } from 'react';
import { db } from '../db/db';
import type { DailyGoal, PhaseType } from '../db/types';
import { saveSettings, useGoals, useSettings } from '../db/hooks';
import { formatDate, todayISO } from '../lib/date';
import { fmt } from '../lib/nutrition';
import { targetsFor } from '../lib/goals';
import { scheduleReminderSync } from '../lib/remindersNative';
import { getLocale, phaseDisplayName, useT } from '../i18n';
import { Modal } from './Modal';
import { PhaseReview } from './PhaseReview';
import { usePro } from '../lib/pro';
import { openPaywall, ProBadge } from './Paywall';
import { NeedsCalculator, type GoalPrefill } from './NeedsCalculator';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

function weekdayName(d: number): string {
  // 2026-09-06 ist ein Sonntag → d Tage addieren
  return new Date(2026, 8, 6 + d).toLocaleDateString(getLocale(), { weekday: 'short' }).replace('.', '');
}

/** Standard-Trainingstage – eigener Abschnitt, damit „Mehr“ die Reihenfolge bestimmen kann. */
export function TrainingDaysSection() {
  const t = useT();
  const settings = useSettings();

  function toggleWeekday(d: number) {
    if (!settings) return;
    const set = new Set(settings.training_weekdays);
    if (set.has(d)) set.delete(d);
    else set.add(d);
    void saveSettings({ training_weekdays: [...set] });
  }

  return (
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
  );
}

/** Phasen: Liste, Anlegen, Bearbeiten, Auswertung. */
export function GoalsView() {
  const pro = usePro();
  const t = useT();
  const goals = useGoals() ?? [];
  const [editing, setEditing] = useState<DailyGoal | 'new' | null>(null);
  const [reviewing, setReviewing] = useState<DailyGoal | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  /** Vorschlag aus dem Rechner – landet im Formular, gespeichert wird erst dort */
  const [prefill, setPrefill] = useState<GoalPrefill | undefined>(undefined);
  const today = todayISO();
  const activeGoal = goals.find((g) => g.start_date <= today && (!g.end_date || today <= g.end_date));

  function applyCalc(p: GoalPrefill, mode: 'new' | 'active') {
    setCalcOpen(false);
    setPrefill(p);
    setEditing(mode === 'active' && activeGoal ? activeGoal : 'new');
  }

  async function remove(g: DailyGoal) {
    if (!confirm(t('goals.confirmDelete', { name: phaseDisplayName(g) }))) return;
    await db.goals.delete(g.id!);
    scheduleReminderSync();
  }

  return (
    <>
      <section className="card section">
        <div className="section-head">
          <h2>{t('goals.phases')}</h2>
          <button className="btn-primary" onClick={() => { setPrefill(undefined); setEditing('new'); }}>
            {t('goals.newPhase')}
          </button>
        </div>
        {goals.length === 0 && <p className="search-empty">{t('goals.none')}</p>}
        <button className="btn-link" onClick={() => setCalcOpen(true)}>
          {t('calc.open')}
        </button>
        <ul className="phase-list">
          {goals.map((g) => {
            const active = g.start_date <= today && (!g.end_date || today <= g.end_date);
            const tr = targetsFor(g, true);
            const r = targetsFor(g, false);
            return (
              <li key={g.id} className={`phase ${active ? 'phase-active' : ''}`}>
                <div className="phase-head">
                  <span className="phase-name">
                    {phaseDisplayName(g)}
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
                  <button className="btn-link" onClick={() => (pro ? setReviewing(g) : openPaywall())}>
                    {t('phase.open')}
                    {!pro && <ProBadge />}
                  </button>
                  <button className="btn-link" onClick={() => { setPrefill(undefined); setEditing(g); }}>
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

      {reviewing && <PhaseReview goal={reviewing} onClose={() => setReviewing(null)} />}
      {editing && (
        <Modal title={editing === 'new' ? t('goals.newTitle') : t('goals.editTitle')} onClose={() => setEditing(null)}>
          <GoalForm goal={editing === 'new' ? undefined : editing} prefill={prefill} onDone={() => setEditing(null)} />
        </Modal>
      )}
      {calcOpen && (
        <Modal title={t('calc.title')} onClose={() => setCalcOpen(false)}>
          <NeedsCalculator hasActive={!!activeGoal} onApply={applyCalc} />
        </Modal>
      )}
    </>
  );
}

function GoalForm({ goal, prefill, onDone }: { goal?: DailyGoal; prefill?: GoalPrefill; onDone: () => void }) {
  const t = useT();
  // Vorschlag aus dem Rechner schlägt die gespeicherten Werte; Name und Daten bleiben.
  const v = { ...goal, ...prefill };
  const typeName = (p: PhaseType) => t(p === 'cut' ? 'ob.phaseCut' : p === 'maintain' ? 'ob.phaseMaintain' : 'ob.phaseBulk');
  const [name, setName] = useState(goal?.phase_name ?? (prefill?.phase_type ? typeName(prefill.phase_type) : ''));
  const [type, setType] = useState<PhaseType | ''>(v.phase_type ?? '');
  const [start, setStart] = useState(goal?.start_date ?? todayISO());
  const [end, setEnd] = useState(goal?.end_date ?? '');
  const [trainKcal, setTrainKcal] = useState(String(v.training_day_kcal ?? 2700));
  const [restKcal, setRestKcal] = useState(String(v.rest_day_kcal ?? 2350));
  const [protein, setProtein] = useState(String(v.protein_g ?? 150));
  const [fatMin, setFatMin] = useState(String(v.fat_min_g ?? 75));
  const [fatMax, setFatMax] = useState(String(v.fat_max_g ?? 90));
  const [error, setError] = useState<string | null>(null);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!name.trim()) return setError(t('goals.errName'));
    if (end && end < start) return setError(t('goals.errDates'));
    if (Number(fatMin) > Number(fatMax)) return setError(t('goals.errFat'));
    const data: Omit<DailyGoal, 'id'> = {
      phase_name: name.trim(),
      phase_type: type || undefined,
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
    scheduleReminderSync();
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
      <div className="field">
        <span>{t('ob.phase')}</span>
        <div className="segmented" role="radiogroup" aria-label={t('ob.phase')}>
          {(['cut', 'maintain', 'bulk'] as PhaseType[]).map((p) => (
            <label key={p} className={type === p ? 'active' : ''}>
              <input
                type="radio"
                name="phase-type"
                checked={type === p}
                onChange={() => {
                  setType(p);
                  setName(t(p === 'cut' ? 'ob.phaseCut' : p === 'maintain' ? 'ob.phaseMaintain' : 'ob.phaseBulk'));
                }}
              />
              {p === 'cut' ? t('ob.phaseCut') : p === 'maintain' ? t('ob.phaseMaintain') : t('ob.phaseBulk')}
            </label>
          ))}
        </div>
      </div>
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
