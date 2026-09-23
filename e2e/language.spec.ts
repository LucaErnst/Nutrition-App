import { expect, test } from '@playwright/test';

/** Der Browser läuft laut playwright.config.ts auf de-CH. */
test('ohne eigene Wahl startet die App in der Gerätesprache', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs.map(
        (d) =>
          new Promise<void>((res) => {
            const r = indexedDB.deleteDatabase(d.name!);
            r.onsuccess = r.onerror = r.onblocked = () => res();
          }),
      ),
    );
  });
  await page.reload();

  await expect(page.getByRole('button', { name: 'Überspringen, Ziele später' })).toBeVisible();
});

test('eine gespeicherte Wahl schlägt die Gerätesprache', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem('nutrition-tracker:language', 'en');
  });
  await page.reload();

  await expect(page.getByRole('button', { name: 'Skip, set targets later' })).toBeVisible();
});
