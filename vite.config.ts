import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

// PHONE=1 npm run dev:phone → HTTPS + im WLAN erreichbar (Kamera braucht HTTPS)
const phone = process.env.PHONE === '1';

// https://vite.dev/config/
export default defineConfig({
  // Für Hosting unter einem Unterpfad (z.B. GitHub Pages: /repo-name/)
  base: process.env.BASE_PATH ?? '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [
    react(),
    ...(phone ? [basicSsl()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ernährung',
        short_name: 'Ernährung',
        description: 'Kalorien- und Makro-Tracking',
        lang: 'de',
        display: 'standalone',
        background_color: '#f4f5f7',
        theme_color: '#2563eb',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Open-Food-Facts-Antworten kurz cachen (Offline-Wiederholung eines Scans)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'off-api', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    host: phone,
  },
  preview: {
    host: phone,
  },
});
