import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

interface Props {
  onDetected: (code: string) => void;
  /** Pausiert die Erkennung (Kamera bleibt an), z.B. während ein Treffer angezeigt wird. */
  paused?: boolean;
}

const HINTS = new Map([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]],
]);

/** Kamera-Vorschau mit kontinuierlicher EAN/UPC-Erkennung (ZXing). */
export function BarcodeScanner({ onDetected, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Aktuelle Callback-Werte in Refs halten, damit der Effekt nicht neu startet.
  const onDetectedRef = useRef(onDetected);
  const pausedRef = useRef(paused);
  useEffect(() => {
    onDetectedRef.current = onDetected;
    pausedRef.current = paused;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Keine Kamera verfügbar (Browser unterstützt getUserMedia nicht oder Seite ist nicht sicher/HTTPS).');
      return;
    }

    let cancelled = false;
    let controls: IScannerControls | undefined;
    let lastCode = '';
    let lastTime = 0;
    const reader = new BrowserMultiFormatReader(HINTS, { delayBetweenScanAttempts: 150 });

    reader
      .decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, video, (result) => {
        if (!result || pausedRef.current) return;
        const code = result.getText();
        const now = Date.now();
        // Denselben Code nicht mehrfach pro Sekunde melden.
        if (code === lastCode && now - lastTime < 1500) return;
        lastCode = code;
        lastTime = now;
        onDetectedRef.current(code);
      })
      .then((c) => {
        if (cancelled) c.stop();
        else {
          controls = c;
          setReady(true);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const name = e instanceof Error ? e.name : '';
        if (name === 'NotAllowedError') setError('Kamerazugriff wurde abgelehnt.');
        else if (name === 'NotFoundError') setError('Keine Kamera gefunden.');
        else setError('Kamera konnte nicht gestartet werden.');
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, []);

  return (
    <div className="scanner">
      <video ref={videoRef} className="scanner-video" muted playsInline />
      {!error && <div className="scanner-frame" aria-hidden="true" />}
      {!error && !ready && <p className="scanner-status">Kamera wird gestartet…</p>}
      {error && <p className="scanner-error" role="alert">{error}</p>}
    </div>
  );
}
