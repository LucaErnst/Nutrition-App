import { useMemo, useState, type FormEvent } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { deleteWeight, upsertWeight, useUnitSystem, useWeights } from '../db/hooks';
import { addDays, formatDate, formatShortDate, todayISO } from '../lib/date';
import { useT } from '../i18n';
import { fmt } from '../lib/nutrition';
import { usePro } from '../lib/pro';
import { openPaywall, ProBadge } from './Paywall';
import { Tip } from './Tip';
import { trendChange, withTrend, type WeightPoint } from '../lib/weight';
import {
  bodyWeightParts,
  bodyWeightUnitFor,
  formatBodyWeight,
  kgToLb,
  lbToKg,
  stoneToKg,
  trendUnitFor,
  type BodyWeightUnit,
} from '../lib/units';

type Range = 30 | 90 | 365 | 0;

export function WeightView() {
  const pro = usePro();
  const t = useT();
  const RANGES: { value: Range; label: string }[] = [
    { value: 30, label: t('weight.r30') },
    { value: 90, label: t('weight.r90') },
    { value: 365, label: t('weight.r365') },
    { value: 0, label: t('weight.rAll') },
  ];
  const weights = useWeights();
  const bodyUnit = bodyWeightUnitFor(useUnitSystem());
  const [date, setDate] = useState(todayISO());
  const [value, setValue] = useState('');
  /** Nur bei Stone: der Pfund-Anteil der Eingabe. */
  const [valueLb, setValueLb] = useState('');
  const [range, setRange] = useState<Range>(90);
  const [showAll, setShowAll] = useState(false);

  const points = useMemo(() => (weights ? withTrend(weights) : []), [weights]);
  const visible = useMemo(() => {
    if (!range) return points;
    const from = addDays(todayISO(), -range);
    return points.filter((p) => p.date >= from);
  }, [points, range]);

  const latest = points[points.length - 1];
  const change7 = trendChange(points, 7);
  const change30 = trendChange(points, 30);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const n = Number(value.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0 || !date) return;
    const kg = toKg(n, Number(valueLb.replace(',', '.')) || 0, bodyUnit);
    await upsertWeight(date, Math.round(kg * 10) / 10);
    setValue('');
    setValueLb('');
  }

  const recent = [...points].reverse();
  const list = showAll ? recent : recent.slice(0, 10);

  return (
    <div className="weight">
      <Tip id="weight-trend" when={(weights?.length ?? 0) >= 3}>
        {t('tip.weightTrend')}
      </Tip>
      <div className="split-side">
      <section className="card section">
        <h2>{t('weight.enter')}</h2>
        <form className="weight-form" onSubmit={submit}>
          <label className="field">
            <span>{t('weight.date')}</span>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <div className="weight-unit-pair">
          <label className="field">
            <span>{bodyUnit === 'st' ? 'st' : bodyUnit}</span>
            <input
              type="number"
              inputMode="decimal"
              step={bodyUnit === 'st' ? 1 : 0.1}
              min={LIMITS[bodyUnit].min}
              max={LIMITS[bodyUnit].max}
              placeholder={latest ? bodyWeightParts(latest.weight, bodyUnit).value : t('weight.placeholder', { n: EXAMPLE[bodyUnit] })}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </label>
          {bodyUnit === 'st' && (
            <label className="field">
              <span>lb</span>
              <input
                type="number"
                inputMode="decimal"
                step={0.1}
                min={0}
                max={13.9}
                placeholder={latest ? bodyWeightParts(latest.weight, bodyUnit).extra?.value : '0'}
                value={valueLb}
                onChange={(e) => setValueLb(e.target.value)}
              />
            </label>
          )}
          </div>
          <button type="submit" className="btn-primary" disabled={!value}>
            {t('common.save')}
          </button>
        </form>
        <p className="search-hint">{t('weight.hint')}</p>
      </section>
      </div>

      {latest && (
        <section className="card section split-main">
          <div className="section-head">
            <h2>{t('weight.history')}</h2>
            <div className="segmented segmented-sm" role="radiogroup" aria-label={t('weight.range')}>
              {RANGES.map((r) => (
                <label key={r.value} className={range === r.value ? 'active' : ''}>
                  <input type="radio" name="range" checked={range === r.value} onChange={() => setRange(r.value)} />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          <div className="weight-stats">
            <div className="week-stat">
              <span className="week-stat-target">{t('weight.current')}</span>
              <span className="week-stat-value">
                <BodyValue kg={latest.weight} unit={bodyUnit} />
              </span>
            </div>
            <div className="week-stat">
              <span className="week-stat-target">{t('weight.trend')}</span>
              <span className="week-stat-value">
                <BodyValue kg={latest.trend} unit={bodyUnit} />
              </span>
            </div>
            <div className="week-stat">
              <span className="week-stat-target">{t('weight.d7')}</span>
              <span className="week-stat-value">{change7 === undefined ? '–' : <Delta v={change7} unit={bodyUnit} />}</span>
            </div>
            <div className="week-stat">
              <span className="week-stat-target">{t('weight.d30')}</span>
              <span className="week-stat-value">{change30 === undefined ? '–' : <Delta v={change30} unit={bodyUnit} />}</span>
            </div>
          </div>

          {pro ? (
            <WeightChart points={visible} unit={bodyUnit} />
          ) : (
            <div className="pro-lock" onClick={openPaywall} role="button" tabIndex={0}>
              <ProBadge />
              <span>{t('pro.lockTrend')}</span>
            </div>
          )}
          <p className="chart-legend">
            <span><span className="legend-swatch legend-weight" /> {t('weight.legendDaily')}</span>
            <span><span className="legend-swatch legend-trend" /> {t('weight.legendTrend')}</span>
          </p>
        </section>
      )}

      {points.length > 0 && (
        <section className="card section split-side-2">
          <h2>{t('weight.entries')}</h2>
          <ul className="weight-list">
            {list.map((p) => {
              const entry = weights!.find((w) => w.date === p.date)!;
              return (
                <li key={p.date} className="weight-row">
                  <span className="weight-date">{formatDate(p.date)}</span>
                  <span className="weight-value">{formatBodyWeight(p.weight, bodyUnit)}</span>
                  <span className="weight-trend">{t('weight.trendShort', { n: formatBodyWeight(p.trend, bodyUnit) })}{p.source === 'health' ? ` · ${t('weight.fromHealth')}` : ''}</span>
                  <button
                    className="btn-icon"
                    onClick={() => void deleteWeight(entry.id!)}
                    aria-label={t('weight.deleteEntry', { date: formatDate(p.date) })}
                    title={t('common.delete')}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          {recent.length > 10 && (
            <button className="btn-link" onClick={() => setShowAll((v) => !v)}>
              {showAll ? t('weight.showLess') : t('weight.showAll', { n: recent.length })}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

/** Beispielwert im leeren Feld – in Pfund wäre "78,4" irreführend. */
const EXAMPLE: Record<BodyWeightUnit, string> = { kg: '78.4', lb: '172.8', st: '12' };

/** Grenzen der Eingabe: 20–300 kg, in der jeweiligen Einheit. */
const LIMITS: Record<BodyWeightUnit, { min: number; max: number }> = {
  kg: { min: 20, max: 300 },
  lb: { min: 44, max: 661 },
  st: { min: 3, max: 47 },
};

function toKg(value: number, lb: number, unit: BodyWeightUnit): number {
  if (unit === 'kg') return value;
  if (unit === 'lb') return lbToKg(value);
  return stoneToKg(value, lb);
}

function BodyValue({ kg, unit }: { kg: number; unit: BodyWeightUnit }) {
  const p = bodyWeightParts(kg, unit);
  return (
    <>
      {p.value} <span className="week-stat-unit">{p.label}</span>
      {p.extra && (
        <>
          {' '}{p.extra.value} <span className="week-stat-unit">{p.extra.label}</span>
        </>
      )}
    </>
  );
}

/** Veränderungen werden auch in England in Pfund gedacht, nicht in Stone. */
function Delta({ v, unit }: { v: number; unit: BodyWeightUnit }) {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '±';
  const cls = Math.abs(v) < 0.05 ? '' : v > 0 ? 'delta-up' : 'delta-down';
  const shown = trendUnitFor(unit) === 'kg' ? Math.abs(v) : kgToLb(Math.abs(v));
  return (
    <span className={cls}>
      {sign}{fmt(shown, 1)} <span className="week-stat-unit">{trendUnitFor(unit)}</span>
    </span>
  );
}

function WeightChart({ points, unit }: { points: WeightPoint[]; unit: BodyWeightUnit }) {
  const t = useT();
  if (points.length === 0) {
    return <p className="search-empty">{t('weight.noneInRange')}</p>;
  }
  // In Stone wäre die Achse unlesbar (12,98 st) – darum Pfund für alles ausser metrisch.
  const chartUnit = trendUnitFor(unit);
  const data = chartUnit === 'kg' ? points : points.map((p) => ({ ...p, weight: kgToLb(p.weight), trend: kgToLb(p.trend) }));
  const values = data.flatMap((p) => [p.weight, p.trend]);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatShortDate(d)}
            tick={{ fontSize: 11, fill: 'var(--text-2)' }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis domain={[min, max]} tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
            labelFormatter={(d) => formatDate(String(d))}
            formatter={(v, name) => [`${fmt(Number(v), 1)} ${chartUnit}`, name === 'weight' ? t('weight.tooltipWeight') : t('weight.tooltipTrend')]}
          />
          <Line type="monotone" dataKey="weight" stroke="var(--text-2)" strokeWidth={1} dot={{ r: 2.5, fill: 'var(--text-2)', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="trend" stroke="var(--accent)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
