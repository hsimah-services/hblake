import { expect, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { createPublished, ensurePage, publicPath } from '../../lib/content.ts';
import { contrastOf } from '../../lib/ui.ts';

// Light/dark mode (website.md): the site follows the system colour scheme until the
// visitor picks one with the header toggle. The choice is remembered on the device and
// applied before first paint, and every mode keeps WCAG AA contrast.

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
  await ensurePage(api, 'home', 'PUBLISHED', { title: 'Welcome', content: '# Welcome\n\nHome page body.' });
});

test.afterAll(async () => {
  await api.dispose();
});

const scheme = (page: import('@playwright/test').Page): Promise<string> =>
  page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);

for (const system of ['light', 'dark'] as const) {
  test.describe(`with a ${system} system scheme`, () => {
    test.use({ colorScheme: system });
    const other = system === 'light' ? 'dark' : 'light';

    test(`the toggle switches to ${other} mode, says so, and keeps AA contrast`, async ({ page }) => {
      const post = await createPublished(api, 'Post');
      await page.goto(publicPath('Post', post.slug));
      expect(await scheme(page)).toMatch(new RegExp(system));
      const toggle = page.getByRole('banner').getByRole('button', { name: `Switch to ${other} mode` });
      await toggle.click();
      expect(await scheme(page)).toBe(other);
      await expect(page.getByRole('banner').getByRole('button', { name: `Switch to ${system} mode` })).toBeVisible();
      await expect(page.getByRole('contentinfo').locator('img[src*="hsimah-"]')).toHaveAttribute('src', new RegExp(`hsimah-${other}`));
      for (const target of [
        page.getByRole('heading', { level: 1 }),
        page.getByRole('banner').getByRole('link').first(),
        page.getByRole('main').locator('p').first(),
        page.getByRole('contentinfo').locator('p').first(),
      ]) {
        expect(await contrastOf(target), `${other} mode contrast: ${(await target.textContent())?.trim().slice(0, 30)}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    test('the choice is remembered and applied before the app loads', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('banner').getByRole('button', { name: `Switch to ${other} mode` }).click();
      // Block the application scripts: only the document itself can set the scheme.
      await page.route(/\/assets\/.*\.js$/, route => route.abort());
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      expect(await scheme(page), 'before the app runs').toBe(other);
      await page.unroute(/\/assets\/.*\.js$/);
      await page.reload();
      await expect(page.getByRole('banner').getByRole('button', { name: `Switch to ${system} mode` })).toBeVisible();
      expect(await scheme(page)).toBe(other);
    });
  });
}
