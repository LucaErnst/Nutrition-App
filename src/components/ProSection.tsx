import { isNative } from '../lib/native';
import { isPreviewFree, setPreviewFree, useProState } from '../lib/pro';
import { useT } from '../i18n';
import { openPaywall } from './Paywall';

/** Mehr → Pro: Status und Einstieg in die Paywall (nur native App). */
export function ProSection() {
  const t = useT();
  const { pro, source, price } = useProState();
  if (!isNative) return null;
  return (
    <section className="card section pro-section">
      <div className="section-head">
        <h2>{t('pro.title')}</h2>
        {pro && <span className="badge">{t('rem.on')}</span>}
      </div>
      <p className="search-hint">{pro ? (source === 'early_adopter' ? t('pro.sectionEarly') : t('pro.sectionActive')) : t('pro.sectionHint')}</p>
      {!pro && (
        <button className="btn-primary" onClick={openPaywall} style={{ marginTop: 10 }}>
          {price ? t('pro.buy', { price }) : t('pro.open')}
        </button>
      )}
      {(source === 'early_adopter' || isPreviewFree()) && (
        <button className="btn-link" onClick={() => setPreviewFree(!isPreviewFree())} style={{ marginTop: 8 }}>
          {isPreviewFree() ? t('pro.previewOff') : t('pro.previewOn')}
        </button>
      )}
    </section>
  );
}
