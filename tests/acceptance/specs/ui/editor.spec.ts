import { expect, test, type Page } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { action, bySlug, ensurePage, hostPage, uniqueSlug } from '../../lib/content.ts';
import { BASE_URL } from '../../lib/env.ts';
import { PNG } from '../../lib/media.ts';
import { signIn } from '../../lib/ui.ts';

// Rich-text articles (spec/ui/admin.md, issue #14): item content is edited as rich text with
// a formatting toolbar, or as Markdown source; Markdown stays the stored format. Images
// are uploaded from the editor and need alt text.

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
  // The admin lists a section for each page that holds items.
  await hostPage('Article');
  await hostPage('Product');
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
  await page.goto('/admin/items/news/new');
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
  await page.goto('/admin/items/news/new');
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
  await page.goto('/admin/items/news/new');
  await mode(page, 'Markdown').click();
  await page.getByLabel('Content').fill('## Section title\n\n- first\n- second\n\n> quoted');
  await mode(page, 'Rich text').click();
  await expect(editor(page).getByRole('heading', { level: 2, name: 'Section title' })).toBeVisible();
  await expect(editor(page).getByRole('listitem')).toHaveCount(2);
  await expect(editor(page).locator('blockquote')).toContainText('quoted');
});

test('links must be web, email or site addresses', async ({ page }) => {
  await page.goto('/admin/items/news/new');
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
  await page.goto('/admin/items/news/new');
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
  await expect(page).toHaveURL(new RegExp(`^${BASE_URL}/admin/items/news/(?!new$)[^/]+$`));
  const post = await bySlug(api, 'Article', slug);
  await action(api, 'Article', 'publish', post!.id);
  await page.goto(`/news/${slug}`); // /<page>/<item>
  const image = page.getByRole('main').getByRole('img', { name: 'A tiny black square' });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth), 'the image loads').toBeGreaterThan(0);
});

test('an item image needs alt text and shows in the page list and on the item route', async ({ page }) => {
  // A page of its own, so the item is listed whatever else is published.
  const slug = uniqueSlug('cover');
  const host = uniqueSlug('gallery');
  await ensurePage(api, host, 'PUBLISHED', { defaultItemKind: 'Photo' });
  await page.goto(`/admin/items/${host}/new`);
  await page.getByLabel('Title').fill(`Cover ${slug}`);
  await page.getByLabel('Slug').fill(slug);
  await page.getByLabel('Excerpt').fill('Has a cover image.');
  await page.getByRole('group', { name: 'Image' }).locator('input[type="file"]').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByLabel('Image alt text')).toBeVisible();
  await page.getByRole('button', { name: /^(create|save)/i }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Please correct' }), 'alt text is required').toBeVisible();
  await page.getByLabel('Image alt text').fill('A tiny cover square');
  await page.getByRole('button', { name: /^(create|save)/i }).click();
  await expect(page.getByRole('status').filter({ hasText: /created/i })).toBeVisible();
  const item = await bySlug(api, 'Article', slug);
  expect(item).toMatchObject({ imageAlt: 'A tiny cover square' });
  await action(api, 'Article', 'publish', item!.id);

  for (const path of [`/pages/${host}`, `/${host}/${slug}`]) {
    await page.goto(path);
    const image = page.getByRole('main').getByRole('img', { name: 'A tiny cover square' }).first();
    await expect(image, path).toBeVisible();
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth), `${path} image loads`).toBeGreaterThan(0);
  }
});

test('pages and products are written as rich text too, saved as Markdown', async ({ page }) => {
  for (const kind of ['Page', 'Product'] as const) {
    const slug = uniqueSlug(`rich-${kind.toLowerCase()}`);
    await page.goto(kind === 'Page' ? '/admin/pages/new' : '/admin/items/products/new');
    await expect(toolbar(page), kind).toBeVisible();
    await page.getByLabel('Title').fill(`Rich ${slug}`);
    await page.getByLabel('Slug').fill(slug);
    await editor(page).click();
    await toolbar(page).getByRole('button', { name: 'Bold' }).click();
    await page.keyboard.type('Strong words');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('status').filter({ hasText: /created/i })).toBeVisible();
    await expect.poll(async () => (await bySlug(api, kind, slug))?.content, kind).toBe('**Strong words**');
  }
});
