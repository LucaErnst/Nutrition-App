import { useSettings } from '../db/hooks';
import { isNative } from '../lib/native';
import { isPreviewFree, setPreviewFree, useProState } from '../lib/pro';
import { useT } from '../i18n';
import { openPaywall } from './Paywall';

/** Mehr → Pro: Status und Einstieg in die Paywall (nur native App). */
export function ProSection() {
  const t = useT();
  const { pro, source, price } = useProState();
  // Wer die App vor 1.1 hatte, darf sich die gesperrte Ansicht jederzeit anschauen – auch
  // nach einem (Sandbox-)Kauf, der den Status auf 'purchase' schiebt. Echte Neukunden
  // bekommen den Schalter nie zu sehen.
  const wasEarlyAdopter = useSettings()?.pro_granted === 'early_adopter';
  if (!isNative) return null;

  const previewToggle = (wasEarlyAdopter || isPreviewFree()) && (
    <button className="btn-link btn-centered" onClick={() => setPreviewFree(!isPreviewFree())} style={{ marginTop: 8 }}>
      {isPreviewFree() ? t('pro.previewOff') : t('pro.previewOn')}
    </button>
  );

  // Gekauft: keine Verkaufsseite mehr, sondern eine ruhige Bestätigung mit Goldakzent.
  if (pro) {
    return (
      <section className="card section pro-section pro-active">
        <div className="pro-hero">
          <img className="pro-hero-logo" src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" width={44} height={44} />
          <div className="pro-hero-text">
            <div className="pro-hero-title">
              {t('pro.title')}
              <span className="pro-badge">PRO</span>
            </div>
            <p className="pro-hero-sub">{source === 'early_adopter' ? t('pro.sectionEarly') : t('pro.sectionActive')}</p>
          </div>
        </div>
        <p className="pro-unlocked">{t('pro.unlockedList')}</p>
        {previewToggle}
      </section>
    );
  }

  return (
    <section className="card section pro-section">
      <div className="section-head">
        <h2>{t('pro.title')}</h2>
      </div>
      <p className="search-hint">{t('pro.sectionHint')}</p>
      <button className="btn-primary btn-centered" onClick={openPaywall} style={{ marginTop: 10 }}>
        {price ? t('pro.buy', { price }) : t('pro.open')}
      </button>
      {previewToggle}
    </section>
  );
}
