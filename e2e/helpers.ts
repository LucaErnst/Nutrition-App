import { expect, type Page } from '@playwright/test';

/** Frische App: IndexedDB und localStorage leeren, dann laden (Seed läuft automatisch). */
export async function freshApp(page: Page) {
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
  await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible();
}

export async function openAddDialog(page: Page, meal: string) {
  await page.getByRole('button', { name: `Add item to ${meal}` }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

/** Fügt ein Referenz-Lebensmittel über die Suche mit der vorgeschlagenen Menge hinzu. */
export async function addFromSearch(page: Page, meal: string, food: string, amount?: string) {
  await openAddDialog(page, meal);
  await page.getByRole('searchbox', { name: 'Search foods' }).fill(food);
  await page.getByRole('dialog').getByText(food, { exact: true }).click();
  if (amount) await page.getByRole('dialog').getByRole('spinbutton', { name: 'Amount' }).fill(amount);
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

export function kcalTotal(page: Page) {
  return page.locator('.summary-kcal-value');
}
