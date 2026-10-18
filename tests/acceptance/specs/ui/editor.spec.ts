import { expect, test, type Page } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { action, bySlug, uniqueSlug } from '../../lib/content.ts';
import { BASE_URL } from '../../lib/env.ts';
import { PNG } from '../../lib/media.ts';
import { signIn } from '../../lib/ui.ts';

// Rich-text posts (spec/ui/admin.md, issue #14): post content is edited as rich text with
// a formatting toolbar, or as Markdown source; Markdown stays the stored format. Images
// are uploaded from the editor and need alt text.

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
});

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test.afterAll(async () => {
  await api.dispose();
});

const editor = (page: Page) => page.getByRole('textbox', { name: 'Content' });
const toolbar = (page: Page) => page.getByRole('toolbar', { name: 'Formatting' });
const mode = (page: Page, name: 'Rich text' | 'Markdown') => page.getByRole('radio', { name });
const markdown = async (page: Page): Promise<string> => {
  await mode(page, 'Markdown').click();
  const source = await page.getByLabel('Content').inputValue();
  await mode(page, 'Rich text').click();
  return source;
};

test('post content is a labelled rich-text editor with a named formatting toolbar', async ({ page }) => {
  await page.goto('/admin/news/new');
  await expect(editor(page)).toHaveAttribute('contenteditable', 'true');
  await expect(editor(page)).toHaveAttribute('aria-multiline', 'true');
  for (const name of ['Bold', 'Italic', 'Strikethrough', 'Inline code', 'Heading 2', 'Heading 3', 'Bulleted list', 'Numbered list', 'Quote', 'Code block', 'Link', 'Image', 'Undo', 'Redo']) {
    await expect(toolbar(page).getByRole('button', { name, exact: true }), name).toBeVisible();
  }
  await expect(mode(page, 'Rich text')).toBeChecked();
  // The toolbar is one Tab stop; arrow keys move between its buttons.
  await toolbar(page).getByRole('button', { name: 'Bold', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(toolbar(page).getByRole('button', { name: 'Italic', exact: true })).toBeFocused();
});

test('formatting shows its pressed state and is saved as Markdown', async ({ page }) => {
  await page.goto('/admin/news/new');
  await editor(page).click();
  await page.keyboard.type('Plain then strong');
  await page.keyboard.press('Shift+Home');
  const bold = toolbar(page).getByRole('button', { name: 'Bold', exact: true });
  await expect(bold).toHaveAttribute('aria-pressed', 'false');
  await bold.click();
  await expect(bold).toHaveAttribute('aria-pressed', 'true');
  expect(await markdown(page)).toContain('**Plain then strong**');
});

test('Markdown source and rich text round-trip', async ({ page }) => {
  await page.goto('/admin/news/new');
  await mode(page, 'Markdown').click();
  await page.getByLabel('Content').fill('## Section title\n\n- first\n- second\n\n> quoted');
  await mode(page, 'Rich text').click();
  await expect(editor(page).getByRole('heading', { level: 2, name: 'Section title' })).toBeVisible();
  await expect(editor(page).getByRole('listitem')).toHaveCount(2);
  await expect(editor(page).locator('blockquote')).toContainText('quoted');
});

test('links must be web, email or site addresses', async ({ page }) => {
  await page.goto('/admin/news/new');
  await editor(page).click();
  await toolbar(page).getByRole('button', { name: 'Link', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Link' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Link address').fill('javascript:alert(1)');
  await dialog.getByRole('button', { name: 'Apply link' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByLabel('Link address').fill('https://example.com/guide');
  await dialog.getByRole('button', { name: 'Apply link' }).click();
  await expect(dialog).toBeHidden();
  expect(await markdown(page)).toContain('](https://example.com/guide)');
});

test('an image needs alt text, uploads from the editor and appears on the published post', async ({ page }) => {
  const slug = uniqueSlug('picture');
  await page.goto('/admin/news/new');
  await page.getByLabel('Title').fill(`Picture ${slug}`);
  await page.getByLabel('Slug').fill(slug);
  await editor(page).click();
  await page.keyboard.type('Before the picture.');
  await toolbar(page).getByRole('button', { name: 'Image', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Insert image' });
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles({ name: 'square.png', mimeType: 'image/png', buffer: PNG });
  await dialog.getByRole('button', { name: 'Insert image' }).click();
  await expect(dialog.getByRole('alert'), 'alt text is required').toBeVisible();
  await dialog.getByLabel('Alt text').fill('A tiny black square');
  await dialog.getByRole('button', { name: 'Insert image' }).click();
  await expect(dialog).toBeHidden();
  await expect(editor(page).getByRole('img', { name: 'A tiny black square' })).toBeVisible();
  expect(await markdown(page)).toMatch(/!\[A tiny black square\]\(\/media\/[a-f0-9]{32}\.png\)/);

  await page.getByRole('button', { name: /^(create|save)/i }).click();
  // Wait for the save itself: /admin/news/new would also match a bare id pattern.
  await expect(page.getByRole('status').filter({ hasText: /created/i })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`^${BASE_URL}/admin/news/(?!new$)[^/]+$`));
  const post = await bySlug(api, 'Post', slug);
  await action(api, 'Post', 'publish', post!.id);
  await page.goto(`/news/${slug}`);
  const image = page.getByRole('main').getByRole('img', { name: 'A tiny black square' });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth), 'the image loads').toBeGreaterThan(0);
});

test('pages and products keep the Markdown textarea', async ({ page }) => {
  for (const path of ['/admin/pages/new', '/admin/products/new']) {
    await page.goto(path);
    await expect(page.getByLabel('Content'), path).toHaveJSProperty('tagName', 'TEXTAREA');
    await expect(toolbar(page), path).toHaveCount(0);
  }
});
