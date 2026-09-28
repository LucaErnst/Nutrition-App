import { useMemo, useState } from 'react';
import type { FoodItem } from '../db/types';
import { deleteFoodItem, toggleFavorite, useFoodUsage, useSavedFoods } from '../db/hooks';
import { fmt } from '../lib/nutrition';
import { FoodItemForm } from './FoodItemForm';
import { Modal } from './Modal';
import { rankFoods } from '../lib/foodRank';
import { useT } from '../i18n';

/**
 * Höchstens so viele Zeilen. Die mitgelieferte Tabelle hat über sechstausend Einträge; wer sie
 * ungefiltert in die Liste hängt, baut 80'000 DOM-Knoten auf und der erste Tastendruck
 * blockiert eine halbe Sekunde. Gelesen wird ohnehin nur der Anfang.
 */
const MAX_ROWS = 60;

export function FoodDatabase() {
  const t = useT();
  const foods = useSavedFoods();
  const usage = useFoodUsage();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<FoodItem | 'new' | null>(null);

  // Selbst gescannt oder angelegt – das ist die Datenbank, die dem Nutzer gehört.
  const own = useMemo(() => (foods ?? []).filter((f) => f.source !== 'reference'), [foods]);
  // Ohne Suchbegriff nur die eigenen: sonst steht hier eine alphabetische Fremdliste,
  // die mit „Amerikaner" und „Apfelschmarren" beginnt, statt dem, was man selbst isst.
  const ranked = useMemo(
    () => (foods ? rankFoods(query.trim() ? foods : own, query, usage) : []),
    [foods, own, query, usage],
  );
  const results = useMemo(() => ranked.slice(0, MAX_ROWS), [ranked]);

  async function remove(item: FoodItem) {
    if (!confirm(t('db.confirmRemove', { name: item.name }))) return;
    await deleteFoodItem(item.id!);
  }

  return (
    <div className="database">
      <div className="db-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder={t('db.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('db.searchLabel')}
        />
        <button className="btn-primary" onClick={() => setEditing('new')}>
          {t('db.new')}
        </button>
      </div>
      <p className="search-hint">
        {!foods
          ? t('common.loading')
          : query.trim()
            ? t('db.count', { shown: results.length, total: ranked.length })
            : t('db.countOwn', { own: own.length, ref: foods.length - own.length })}
        {/* Der Hinweis auf die Werte gehört nur dorthin, wo auch Werte stehen. */}
        {results.length > 0 && <> · {t('db.hint')}</>}
      </p>
      <ul className="db-list card">
        {results.map((f) => (
          <li key={f.id} className="db-item">
            <div className="db-item-main">
              <span className="search-item-name">{f.name}</span>
              <span className="db-item-meta">
                {f.brand && <>{f.brand} · </>}
                {t(`db.source.${f.source}`)}
                {f.unit_type === 'piece' && ` · ${t('db.perPiece', { n: fmt(f.piece_weight_g ?? 0) })}`}
              </span>
            </div>
            <div className="db-item-macros">
              <span className="entry-kcal">{fmt(f.kcal_per_100g)} kcal</span>
              <span>{t('macro.p')} {fmt(f.protein_per_100g, 1)}</span>
              <span>{t('macro.f')} {fmt(f.fat_per_100g, 1)}</span>
              <span>{t('macro.c')} {fmt(f.carbs_per_100g, 1)}</span>
            </div>
            <div className="db-item-actions">
              <button className={`btn-link star-text ${f.favorite ? 'on' : ''}`} onClick={() => void toggleFavorite(f)} aria-pressed={!!f.favorite}>
                {f.favorite ? '★' : '☆'} {t('db.favorite')}
              </button>
              <button className="btn-link" onClick={() => setEditing(f)}>
                {t('common.edit')}
              </button>
              <button className="btn-link danger" onClick={() => void remove(f)}>
                {t('common.remove')}
              </button>
            </div>
          </li>
        ))}
        {foods && results.length === 0 && (
          <li className="search-empty">{query.trim() ? t('db.none') : t('db.noneOwn')}</li>
        )}
      </ul>

      {editing && (
        <Modal title={editing === 'new' ? t('db.newFood') : t('db.editFood')} onClose={() => setEditing(null)}>
          <FoodItemForm item={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
