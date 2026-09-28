import { defineConfig } from 'vitest/config';

// Nur Unit-Tests unter src/ – die Playwright-Specs in e2e/ laufen separat.
export default defineConfig({
  // Wie in vite.config.ts: Module, die die Versionsnummer einsetzen, sind sonst nicht importierbar.
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
