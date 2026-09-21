/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;

interface Window {
  /** Blendet den Start-Screen aus index.html aus (dort definiert). */
  __hideSplash?: () => void;
}
