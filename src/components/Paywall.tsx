import { useState, useSyncExternalStore } from 'react';
import { purchasePro, restorePro, useProState } from '../lib/pro';
import { useI18n, useT } from '../i18n';
import { Modal } from './Modal';

const LEGAL_BASE = 'https://lucaernst.github.io/Nutrition-App/legal/';

// Globaler Schalter, damit jede Stelle in der App die Paywall öffnen kann
let open = false;
const listeners = new Set<() => void>();
export function openPaywall() {
  open = true;
  for (const fn of listeners) fn();
}
function closePaywall() {
  open = false;
  for (const fn of listeners) fn();
}
function usePaywallOpen() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => open,
  );
}

/** Rendert die Paywall, wenn sie irgendwo geöffnet wurde (in App.tsx eingehängt). */
export function PaywallHost() {
  const isOpen = usePaywallOpen();
  return isOpen ? <Paywall onClose={closePaywall} /> : null;
}

function Paywall({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { lang } = useI18n();
  const { pro, price, ready } = useProState();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setNote(null);
    const r = await purchasePro();
    setBusy(false);
    if (r === 'purchased') {
      setNote(t('pro.thanks'));
      setTimeout(onClose, 1200);
    } else if (r === 'cancelled') setNote(null);
    else if (r === 'unavailable') setNote(t('pro.unavailable'));
    else setNote(t('pro.error'));
  }

  async function restore() {
    setBusy(true);
    setNote(null);
    const ok = await restorePro();
    setBusy(false);
    setNote(ok ? t('pro.restored') : t('pro.nothingToRestore'));
    if (ok) setTimeout(onClose, 1200);
  }

  const features: string[] = ['pro.fHealth', 'pro.fPhase', 'pro.fWidgets', 'pro.fTemplates', 'pro.fPortions', 'pro.fTrend', 'pro.fCsv'].map((k) => t(k as never));

  return (
    <Modal title={t('pro.title')} onClose={onClose}>
      <div className="paywall">
        <div className="paywall-brand">
          <span className="paywall-mark">BS</span>
          <div>
            <div className="paywall-name">Serious Nutrition Pro</div>
            <div className="search-hint">{t('pro.tagline')}</div>
          </div>
        </div>
        <ul className="paywall-features">
          {features.map((f) => (
            <li key={f}>
              <span className="conclusion-icon" aria-hidden="true">✓</span>
              {f}
            </li>
          ))}
        </ul>
        <p className="paywall-free">{t('pro.freeStays')}</p>

        {pro ? (
          <p className="form-ok">{t('pro.active')}</p>
        ) : (
          <>
            <button className="btn-primary paywall-buy" onClick={() => void buy()} disabled={busy || !ready}>
              {price ? t('pro.buy', { price }) : t('pro.buyNoPrice')}
            </button>
            <p className="search-hint paywall-once">{t('pro.once')}</p>
            <button className="btn-link" onClick={() => void restore()} disabled={busy}>
              {t('pro.restore')}
            </button>
          </>
        )}
        {note && <p className="search-hint" role="status">{note}</p>}
        <p className="legal-links paywall-legal">
          <a href={`${LEGAL_BASE}terms-${lang}.html`} target="_blank" rel="noopener">{t('more.terms')}</a>
          <a href={`${LEGAL_BASE}privacy-${lang}.html`} target="_blank" rel="noopener">{t('more.privacy')}</a>
        </p>
      </div>
    </Modal>
  );
}

/** Kleines Schloss-Label für gesperrte Stellen; Tippen öffnet die Paywall. */
export function ProBadge({ className = '' }: { className?: string }) {
  const t = useT();
  return (
    <button type="button" className={`pro-badge ${className}`} onClick={openPaywall} aria-label={t('pro.title')}>
      PRO
    </button>
  );
}
