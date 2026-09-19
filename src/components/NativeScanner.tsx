import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { haptic } from '../lib/native';

interface Props {
  onDetected: (code: string) => void;
}

type State = 'idle' | 'scanning' | 'denied' | 'error';

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
