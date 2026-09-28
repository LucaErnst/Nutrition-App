import { useEffect, useRef, useState } from 'react';
import { searchProducts, type OffProduct } from '../lib/openfoodfacts';
import { fmt } from '../lib/nutrition';
import { useT } from '../i18n';

/**
 * Produkte von Open Food Facts. Dieselbe Suche im Tagebuch und im Reiter „Datenbank" – dort
 * stand vorher nur die mitgelieferte Tabelle, und wer ein Markenprodukt suchte, hielt die
 * Suche für kaputt.
 *
 * Gesucht wird weltweit. Eine Einschränkung aufs eigene Land klang sinnvoll, traf in der Praxis
 * aber die Falschen: Wer sein iPhone auf Englisch stellt, wohnt deswegen nicht in den USA – und
 * bekam dann amerikanische Regale samt einem Kästchen, das er erst anklicken musste.
 */

/** Ab wie vielen Zeichen von selbst gesucht wird und wie lange nach dem letzten Tastendruck. */
const AUTO_SEARCH_MIN_CHARS = 3;
const AUTO_SEARCH_DELAY_MS = 600;

type OffState =
  | { kind: 'idle' }
  | { kind: 'loading'; query: string }
  | { kind: 'results'; query: string; products: OffProduct[]; total: number; page: number; hasMore: boolean; loadingMore?: boolean }
  | { kind: 'error'; message: string };

interface Props {
  /** Der Suchtext des übergeordneten Felds. */
  query: string;
  onPick: (product: OffProduct) => void;
}

export function ProductSearch({ query, onPick }: Props) {
  const t = useT();
  const [off, setOff] = useState<OffState>({ kind: 'idle' });
  /** Laufende Nummer des Suchlaufs: eine späte Antwort darf ein neueres Ergebnis nicht überschreiben. */
  const runId = useRef(0);
  const q = query.trim();

  // Neuer Suchtext heisst: das alte Ergebnis gehört nicht mehr dazu.
  const lastQuery = useRef(q);
  if (lastQuery.current !== q) {
    lastQuery.current = q;
    if (off.kind !== 'idle') setOff({ kind: 'idle' });
  }

  async function search() {
    const id = ++runId.current;
    setOff({ kind: 'loading', query: q });
    const res = await searchProducts(q);
    if (id !== runId.current) return;
    if (res.status === 'found') setOff({ kind: 'results', query: q, products: res.products, total: res.total, page: res.page, hasMore: res.hasMore });
    else setOff({ kind: 'error', message: res.message });
  }

  /** Nächste Seite anhängen – vorher sah man nur die ersten Treffer und sonst nichts. */
  async function loadMore() {
    if (off.kind !== 'results' || off.loadingMore) return;
    const current = off;
    const id = runId.current;
    setOff({ ...current, loadingMore: true });
    const res = await searchProducts(current.query, { page: current.page + 1 });
    if (id !== runId.current) return;
    if (res.status === 'found') {
      const seen = new Set(current.products.map((p) => p.barcode));
      setOff({
        ...current,
        products: [...current.products, ...res.products.filter((p) => !seen.has(p.barcode))],
        total: res.total,
        page: res.page,
        hasMore: res.hasMore,
        loadingMore: false,
      });
    } else {
      setOff({ kind: 'error', message: res.message });
    }
  }

  // Produkte kommen von selbst, sobald jemand aufhört zu tippen. Nach einem Fehler wird nicht
  // von allein wiederholt – sonst läuft die Suche bei einer Störung endlos gegen die Wand.
  useEffect(() => {
    if (q.length < AUTO_SEARCH_MIN_CHARS || off.kind !== 'idle') return;
    const timer = window.setTimeout(() => void search(), AUTO_SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, off.kind]);

  if (q.length < 2) return null;

  return (
    <div className="off-search">
      {off.kind === 'idle' && (
        <div className="off-search-row">
          <button type="button" className="btn-secondary" onClick={() => void search()}>
            {t('search.offButton', { q })}
          </button>
        </div>
      )}
      {off.kind === 'loading' && <p className="search-hint">{t('search.offSearching', { q: off.query })}</p>}
      {off.kind === 'error' && (
        <>
          <p className="form-error" role="alert">
            {off.message}
          </p>
          <button type="button" className="btn-link btn-centered" onClick={() => void search()}>
            {t('search.offRetry')}
          </button>
        </>
      )}
      {off.kind === 'results' && (
        <>
          <p className="search-hint">
            {off.products.length === 0
              ? t('search.offNone')
              : t('search.offResults', { shown: off.products.length, total: fmt(off.total) })}
            {off.query !== q && t('search.offFor', { q: off.query })}
          </p>
          <ul className="search-list">
            {off.products.map((p) => (
              <li key={p.barcode}>
                <button className="search-item" onClick={() => onPick(p)}>
                  <span className="search-item-main">
                    <span className="search-item-name">{p.name}</span>
                    <span className="search-item-portion">
                      {p.brand && `${p.brand} · `}
                      {t('search.per100', { unit: p.is_liquid ? 'ml' : 'g' })} · {t('macro.p')} {fmt(p.protein_per_100g)} · {t('macro.f')} {fmt(p.fat_per_100g)} · {t('macro.c')} {fmt(p.carbs_per_100g)}
                      {p.incomplete && ` · ${t('search.incomplete')}`}
                    </span>
                  </span>
                  <span className="search-item-kcal">{fmt(p.kcal_per_100g)} kcal</span>
                </button>
              </li>
            ))}
          </ul>
          {off.hasMore && (
            <button type="button" className="btn-link btn-centered" onClick={() => void loadMore()} disabled={off.loadingMore}>
              {off.loadingMore ? t('search.offLoading') : t('search.offMore')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
