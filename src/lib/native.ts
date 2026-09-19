import { Capacitor } from '@capacitor/core';

/** true, wenn die App als native Hülle (Capacitor) auf iOS/Android läuft. */
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

/** Kurzes haptisches Feedback (nur nativ; im Web ohne Wirkung). */
export async function haptic(kind: 'light' | 'medium' | 'success' = 'light') {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    if (kind === 'success') await Haptics.notification({ type: NotificationType.Success });
    else await Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch {
    /* Plugin nicht verfügbar – ignorieren */
  }
}

/** Native Initialisierung: Statusleiste, Splash ausblenden, Android-Zurück-Taste. */
export async function initNative() {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    if (platform === 'android') await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    /* ignorieren */
  }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    /* ignorieren */
  }
  try {
    const { autoBackupIfDue } = await import('./backup');
    const { syncReminders } = await import('./remindersNative');
    void autoBackupIfDue();
    void syncReminders();
    const { App } = await import('@capacitor/app');
    await App.addListener('resume', () => {
      void autoBackupIfDue();
      void syncReminders();
    });
    // Android: Zurück-Taste schliesst offene Dialoge (Escape), sonst App in den Hintergrund
    await App.addListener('backButton', () => {
      const dialog = document.querySelector('.modal-backdrop');
      if (dialog) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      } else {
        void App.minimizeApp();
      }
    });
  } catch {
    /* ignorieren */
  }
}

/**
 * Datei teilen: nativ über das System-Share-Sheet (Datei in den Cache schreiben),
 * im Web über navigator.share bzw. Download.
 */
export async function shareFile(file: File): Promise<'shared' | 'downloaded'> {
  if (isNative) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const text = await file.text();
    const written = await Filesystem.writeFile({ path: file.name, data: text, directory: Directory.Cache, encoding: 'utf8' as never });
    await Share.share({ title: file.name, url: written.uri });
    return 'shared';
  }

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return 'shared';
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw e;
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
