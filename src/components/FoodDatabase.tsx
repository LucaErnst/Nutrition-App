import { useMemo, useState } from 'react';
import type { FoodItem } from '../db/types';
import { deleteFoodItem, toggleFavorite, useSavedFoods } from '../db/hooks';
import { fmt } from '../lib/nutrition';
import { FoodItemForm } from './FoodItemForm';
import { Modal } from './Modal';
import { normalize } from './FoodSearch';
import { useT } from '../i18n';

export function FoodDatabase() {
  const t = useT();
  const foods = useSavedFoods();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<FoodItem | 'new' | null>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!foods) return [];
    if (!q) return foods;
    return foods.filter((f) => normalize(`${f.name} ${f.brand ?? ''}`).includes(q));
  }, [foods, query]);

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
        {foods ? t('db.count', { shown: results.length, total: foods.length }) : t('common.loading')} · {t('db.hint')}
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
        {foods && results.length === 0 && <li className="search-empty">{t('db.none')}</li>}
      </ul>

      {editing && (
        <Modal title={editing === 'new' ? t('db.newFood') : t('db.editFood')} onClose={() => setEditing(null)}>
          <FoodItemForm item={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
