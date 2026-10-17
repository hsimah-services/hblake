import { expect, test, type Locator, type Page } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { ensurePage } from '../../lib/content.ts';

// Animations (website.md): hover animations follow the system's reduced-motion setting
// until the visitor turns them on or off with the header toggle. The choice is
// remembered and applied before first paint. With animations off, changes still happen
// (the underline still shows) but nothing moves over time and tiles do not grow.

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
  await ensurePage(api, 'home', 'PUBLISHED', { title: 'Welcome', content: '# Welcome\n\nHome page body.' });
  await ensurePage(api, 'about', 'PUBLISHED', { title: 'About' });
});

test.afterAll(async () => {
  await api.dispose();
});

const toggle = (page: Page, name: RegExp): Locator => page.getByRole('banner').getByRole('button', { name });
const navLink = (page: Page): Locator => page.getByRole('navigation', { name: 'Main navigation' }).locator('a[href="/pages/about"]');
const tile = (page: Page): Locator => page.getByRole('region', { name: 'Explore the site' }).locator('a[href="/pages/about"]');
const seconds = (value: string): number => Math.max(...value.split(',').map(part => (part.trim().endsWith('ms') ? parseFloat(part) / 1000 : parseFloat(part))));
const longestTransition = (target: Locator): Promise<number> => target.evaluate(element => getComputedStyle(element).transitionDuration).then(seconds);

for (const system of ['no-preference', 'reduce'] as const) {
  test.describe(`with reduced motion ${system === 'reduce' ? 'requested' : 'not requested'} by the system`, () => {
    test.use({ reducedMotion: system, viewport: { width: 1280, height: 900 } });
    const animated = system === 'no-preference';

    test(`animations start ${animated ? 'on' : 'off'} and the toggle turns them ${animated ? 'off' : 'on'}`, async ({ page }) => {
      await page.goto('/');
      const link = navLink(page);
      if (animated) expect(await longestTransition(link), 'nav hover animates').toBeGreaterThan(0.1);
      else expect(await longestTransition(link), 'nav hover is instant').toBeLessThan(0.01);

      await toggle(page, animated ? /turn off animations/i : /turn on animations/i).click();
      await expect(toggle(page, animated ? /turn on animations/i : /turn off animations/i)).toBeVisible();
      if (animated) expect(await longestTransition(link)).toBeLessThan(0.01);
      else expect(await longestTransition(link)).toBeGreaterThan(0.1);
    });
  });
}

test.describe('with animations off', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });

  test('hover still underlines links, but tiles do not grow', async ({ page }) => {
    await page.goto('/');
    await navLink(page).hover();
    await expect.poll(() => navLink(page).evaluate(element => getComputedStyle(element).backgroundSize)).toBe('100% 2px');
    await tile(page).hover();
    expect(await tile(page).evaluate(element => getComputedStyle(element).transform)).toBe('none');
  });
});

test.describe('with animations on', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });

  test('the underline grows from the middle and tiles grow on hover', async ({ page }) => {
    await page.goto('/');
    const link = navLink(page);
    expect(await link.evaluate(element => getComputedStyle(element).backgroundPosition), 'centred, so it grows both ways').toMatch(/^50%/);
    await link.hover();
    await expect.poll(() => link.evaluate(element => getComputedStyle(element).backgroundSize)).toBe('100% 2px');
    await tile(page).hover();
    await expect.poll(() => tile(page).evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
  });

  test('turning animations off is remembered and applied before the app loads', async ({ page }) => {
    await page.goto('/');
    await toggle(page, /turn off animations/i).click();
    await page.route(/\/assets\/.*\.js$/, route => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-motion')), 'before the app runs').toBe('reduce');
    await page.unroute(/\/assets\/.*\.js$/);
    await page.reload();
    await expect(toggle(page, /turn on animations/i)).toBeVisible();
    expect(await longestTransition(navLink(page))).toBeLessThan(0.01);
  });
});
