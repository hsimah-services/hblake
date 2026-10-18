import { expect, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { KINDS, collection, pageOf } from '../../lib/content.ts';
import { OPERATOR } from '../../lib/env.ts';

// Runs first, against the database scripts/acceptance/up just installed and
// bootstrapped: one operator account and no content. website.md: Posts and Products
// may be empty at launch, with useful empty states and no fabricated content.

test.describe.configure({ mode: 'serial' });

test('the stack starts with no content', async () => {
  const api = await Api.operator();
  for (const kind of KINDS) {
    const page = await pageOf(api, kind);
    expect(page.totalCount, `${collection(kind)} must be empty; rerun scripts/acceptance/up for a fresh database`).toBe(0);
    expect(page.nodes).toEqual([]);
  }
  await api.dispose();
});

test('bootstrap provisions exactly the configured operator as an admin', async () => {
  const api = await Api.operator();
  const viewer = await api.viewer();
  expect(viewer).toMatchObject({ displayName: OPERATOR.displayName, role: 'ADMIN' });
  expect(viewer!.id).toBeTruthy();
  await api.dispose();
});

test('home shows a meaningful unavailable state when no home page is published', async ({ page }) => {
  await page.goto('/');
  const main = page.getByRole('main');
  await expect(main).toBeVisible();
  await expect(main).not.toHaveText(/^\s*$/);
  await expect(page.getByText(/unexpected application error/i)).toHaveCount(0);
});

test('navigation omits links to missing pages and empty collections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  for (const href of ['/pages/services', '/pages/about', '/pages/contact', '/news', '/products']) {
    await expect(page.locator(`nav a[href="${href}"]`), `no navigation link to ${href}`).toHaveCount(0);
  }
});

test('empty post and product lists render an empty state', async ({ page }) => {
  await page.goto('/news');
  await expect(page.getByRole('main').getByText(/no news/i)).toBeVisible();
  await page.goto('/products');
  await expect(page.getByRole('main').getByText(/no products/i)).toBeVisible();
});
