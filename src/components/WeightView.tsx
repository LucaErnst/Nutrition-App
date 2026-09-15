import { useMemo, useState, type FormEvent } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { deleteWeight, upsertWeight, useWeights } from '../db/hooks';
import { addDays, todayISO } from '../lib/date';
import { fmt } from '../lib/nutrition';
import { trendChange, withTrend, type WeightPoint } from '../lib/weight';

type Range = 30 | 90 | 365 | 0;

const RANGES: { value: Range; label: string }[] = [
  { value: 30, label: '30 Tage' },
  { value: 90, label: '90 Tage' },
  { value: 365, label: '1 Jahr' },
  { value: 0, label: 'Alles' },
];

export function WeightView() {
  const weights = useWeights();
  const [date, setDate] = useState(todayISO());
  const [value, setValue] = useState('');
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
    await upsertWeight(date, Math.round(n * 10) / 10);
    setValue('');
  }

  const recent = [...points].reverse();
  const list = showAll ? recent : recent.slice(0, 10);

  return (
    <div className="weight">
      <section className="card section">
        <h2>Gewicht eintragen</h2>
        <form className="weight-form" onSubmit={submit}>
          <label className="field">
            <span>Datum</span>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="field">
            <span>kg</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={20}
              max={300}
              placeholder={latest ? fmt(latest.weight, 1) : 'z.B. 78,4'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn-primary" disabled={!value}>
            Speichern
          </button>
        </form>
        <p className="search-hint">Ein Eintrag pro Tag; ein zweiter Eintrag am selben Tag überschreibt den ersten.</p>
      </section>

      {latest && (
        <section className="card section">
          <div className="section-head">
            <h2>Verlauf</h2>
            <div className="segmented segmented-sm" role="radiogroup" aria-label="Zeitraum">
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
              <span className="week-stat-target">Aktuell</span>
              <span className="week-stat-value">
                {fmt(latest.weight, 1)} <span className="week-stat-unit">kg</span>
              </span>
            </div>
            <div className="week-stat">
              <span className="week-stat-target">Trend (7-Tage-Schnitt)</span>
              <span className="week-stat-value">
                {fmt(latest.trend, 1)} <span className="week-stat-unit">kg</span>
              </span>
            </div>
            <div className="week-stat">
              <span className="week-stat-target">Δ 7 Tage</span>
              <span className="week-stat-value">{change7 === undefined ? '–' : <Delta v={change7} />}</span>
            </div>
            <div className="week-stat">
              <span className="week-stat-target">Δ 30 Tage</span>
              <span className="week-stat-value">{change30 === undefined ? '–' : <Delta v={change30} />}</span>
            </div>
          </div>

          <WeightChart points={visible} />
          <p className="chart-legend">
            <span><span className="legend-swatch legend-weight" /> Tagesgewicht</span>
            <span><span className="legend-swatch legend-trend" /> Trend (gleitender 7-Tage-Schnitt)</span>
          </p>
        </section>
      )}

      {points.length > 0 && (
        <section className="card section">
          <h2>Einträge</h2>
          <ul className="weight-list">
            {list.map((p) => {
              const entry = weights!.find((w) => w.date === p.date)!;
              return (
                <li key={p.date} className="weight-row">
                  <span className="weight-date">{formatDate(p.date)}</span>
                  <span className="weight-value">{fmt(p.weight, 1)} kg</span>
                  <span className="weight-trend">Trend {fmt(p.trend, 1)}</span>
                  <button
                    className="btn-icon"
                    onClick={() => void deleteWeight(entry.id!)}
                    aria-label={`Eintrag vom ${formatDate(p.date)} löschen`}
                    title="Löschen"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          {recent.length > 10 && (
            <button className="btn-link" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Weniger anzeigen' : `Alle ${recent.length} anzeigen`}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

function Delta({ v }: { v: number }) {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '±';
  const cls = Math.abs(v) < 0.05 ? '' : v > 0 ? 'delta-up' : 'delta-down';
  return (
    <span className={cls}>
      {sign}{fmt(Math.abs(v), 1)} <span className="week-stat-unit">kg</span>
    </span>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function WeightChart({ points }: { points: WeightPoint[] }) {
  if (points.length === 0) {
    return <p className="search-empty">Keine Einträge im gewählten Zeitraum.</p>;
  }
  const values = points.flatMap((p) => [p.weight, p.trend]);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => `${Number(d.slice(8, 10))}.${Number(d.slice(5, 7))}.`}
            tick={{ fontSize: 11, fill: 'var(--text-2)' }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis domain={[min, max]} tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
            labelFormatter={(d) => formatDate(String(d))}
            formatter={(v, name) => [`${fmt(Number(v), 1)} kg`, name === 'weight' ? 'Gewicht' : 'Trend']}
          />
          <Line type="monotone" dataKey="weight" stroke="var(--text-2)" strokeWidth={1} dot={{ r: 2.5, fill: 'var(--text-2)', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="trend" stroke="var(--accent)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
