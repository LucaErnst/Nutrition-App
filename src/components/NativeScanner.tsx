import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { haptic, syncNativeBackground } from '../lib/native';

interface Props {
  onDetected: (code: string) => void;
}

type State = 'idle' | 'scanning' | 'denied' | 'error';

/**
 * Schwarze Fläche über der App, solange die Kamera öffnet oder schliesst. Das Scan-Fenster des
 * Plugins ist durchsichtig, bis das Kamerabild kommt – ohne Abdeckung sah man beim Öffnen und
 * Schliessen kurz die App mit Rahmen und X darüber. Direkt am <body>, damit sie auch dann weich
 * ausblendet, wenn nach einem Treffer die Scan-Ansicht schon weg ist.
 */
const COVER_MS = 220;
let coverEl: HTMLDivElement | null = null;

function coverOn(): Promise<void> {
  if (!coverEl) {
    coverEl = document.createElement('div');
    coverEl.className = 'scan-cover';
    coverEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(coverEl);
  }
  return new Promise((r) => window.setTimeout(r, COVER_MS));
}

function coverOff() {
  const el = coverEl;
  if (!el) return;
  coverEl = null;
  el.classList.add('scan-cover-out');
  window.setTimeout(() => el.remove(), COVER_MS + 30);
}

/**
 * Nativer Scanner (ML Kit) in der Capacitor-Hülle: öffnet die System-Scanansicht.
 * Ersetzt den ZXing-Web-Scanner; die Kamera-Freigabe wird vom System gespeichert.
 */
export function NativeScanner({ onDetected }: Props) {
  const t = useT();
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function scan() {
    setMessage(null);
    setState('scanning');
    try {
      const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');
      const perm = await BarcodeScanner.requestPermissions();
      if (perm.camera !== 'granted' && perm.camera !== 'limited') {
        setState('denied');
        setMessage(t('scan.errDenied'));
        return;
      }
      await coverOn();
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE],
      });
      setState('idle');
      const code = barcodes[0]?.rawValue;
      if (code) {
        void haptic('success');
        onDetected(code);
      }
    } catch (e) {
      // Abbruch durch Nutzer ist kein Fehler
      const msg = e instanceof Error ? e.message : String(e);
      if (/cancel/i.test(msg)) {
        setState('idle');
        return;
      }
      setState('error');
      setMessage(t('scan.errStart'));
    } finally {
      // Das Plugin lässt den Hintergrund hinter der WebView weiss zurück.
      void syncNativeBackground();
      coverOff();
    }
  }

  // Beim Öffnen des Tabs direkt scannen
  useEffect(() => {
    void scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="scanner native-scanner">
      {state === 'scanning' ? (
        <p className="scanner-status">{t('scan.starting')}</p>
      ) : (
        <div className="native-scanner-idle">
          {message && (
            <p className="scanner-error" role="alert" style={{ position: 'static' }}>
              {message}
            </p>
          )}
          <button type="button" className="btn-primary" onClick={() => void scan()}>
            {t('scan.open')}
          </button>
          {state === 'denied' && (
            <button
              type="button"
              className="btn-link"
              onClick={async () => {
                const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
                await BarcodeScanner.openSettings();
              }}
            >
              {t('scan.openSettings')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
