import { defineConfig } from 'vitest/config';

// Nur Unit-Tests unter src/ – die Playwright-Specs in e2e/ laufen separat.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
