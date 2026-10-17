import { expect, test, type Locator, type Page } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { createPublished, ensurePage, publicPath, uniqueSlug } from '../../lib/content.ts';
import { BASE_URL } from '../../lib/env.ts';
import { signIn } from '../../lib/ui.ts';

// Phone-sized screens (website.md): no sideways scrolling, a disclosure menu for the
// site navigation, and touch targets of at least 44 by 44 CSS pixels.

test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
  await ensurePage(api, 'home', 'PUBLISHED', { title: 'Welcome', content: '# Welcome\n\nHome page body.' });
  await ensurePage(api, 'services', 'PUBLISHED', { title: 'Services' });
});

test.afterAll(async () => {
  await api.dispose();
});

const overflow = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const menuButton = (page: Page): Locator => page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Menu' });
const navLink = (page: Page, href: string): Locator => page.getByRole('navigation', { name: 'Main navigation' }).locator(`a[href="${href}"]`);

async function expectTouchTarget(target: Locator, label: string): Promise<void> {
  const box = await target.boundingBox();
  expect(box, `${label} is laid out`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44);
}

test('public and admin screens fit the width without sideways scrolling', async ({ page }) => {
  const post = await createPublished(api, 'Post', { content: `A ${'long '.repeat(60)}body with an unbroken ${'x'.repeat(40)} word.` });
  for (const path of ['/', '/posts', '/products', publicPath('Post', post.slug), `/pages/missing-${uniqueSlug()}`, '/admin/login']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    expect(await overflow(page), `${path} overflows`).toBeLessThanOrEqual(0);
  }
  await signIn(page);
  for (const path of ['/admin', '/admin/posts', '/admin/posts/new']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    expect(await overflow(page), `${path} overflows`).toBeLessThanOrEqual(0);
  }
});

test('the navigation collapses behind a menu button that opens and closes accessibly', async ({ page }) => {
  await page.goto('/');
  const button = menuButton(page);
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  const controls = await button.getAttribute('aria-controls');
  expect(controls, 'the button names the region it controls').toBeTruthy();
  await expect(navLink(page, '/pages/services')).toBeHidden();

  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator(`[id="${controls}"]`)).toBeVisible();
  await expect(navLink(page, '/pages/services')).toBeVisible();

  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button, 'Escape returns focus to the menu button').toBeFocused();
  await expect(navLink(page, '/pages/services')).toBeHidden();

  await button.click();
  await navLink(page, '/pages/services').click();
  await expect(page).toHaveURL(`${BASE_URL}/pages/services`);
  await expect(button, 'following a link closes the menu').toHaveAttribute('aria-expanded', 'false');
});

test('the current page is marked in the open menu by more than colour', async ({ page }) => {
  await page.goto('/pages/services');
  await menuButton(page).click();
  const current = navLink(page, '/pages/services');
  await expect(current).toHaveAttribute('aria-current', 'page');
  expect(await current.evaluate(element => getComputedStyle(element).backgroundSize), 'its underline is drawn').toBe('100% 2px');
});

test('menu, navigation, mode toggle and footer links are at least 44px touch targets', async ({ page }) => {
  await page.goto('/');
  await expectTouchTarget(menuButton(page), 'menu button');
  await expectTouchTarget(page.getByRole('banner').getByRole('button', { name: /switch to (dark|light) mode/i }), 'colour mode toggle');
  await expectTouchTarget(page.getByRole('banner').getByRole('button', { name: /turn (on|off) animations/i }), 'animation toggle');
  await menuButton(page).click();
  for (const href of ['/', '/pages/services']) await expectTouchTarget(navLink(page, href), `nav link ${href}`);
  for (const link of await page.getByRole('contentinfo').getByRole('link').all()) {
    await expectTouchTarget(link, `footer link ${await link.getAttribute('aria-label')}`);
  }
});
