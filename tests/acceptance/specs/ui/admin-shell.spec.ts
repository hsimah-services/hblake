import { expect, test, type Locator, type Page } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { adminPath, byId, createOk, hostPage, type Kind } from '../../lib/content.ts';
import { BASE_URL, RUN_ID } from '../../lib/env.ts';
import { signIn } from '../../lib/ui.ts';

// The WordPress-style admin (spec/ui/admin.md): a sidebar of Pages and of each page that
// holds items (News, Products), at /admin/pages and /admin/items/<page>, a table of
// each type's records with view, edit and delete actions, an "Add new" form, relative
// timestamps with the absolute time available on hover, focus and to screen readers.

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
});

test.beforeAll(async () => {
  // The sidebar has a section for each page that holds items.
  await hostPage('Article');
  await hostPage('Product');
});

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test.afterAll(async () => {
  await api.dispose();
});

const sidebar = (page: Page): Locator => page.getByRole('navigation', { name: 'Administration' });
const rowOf = (page: Page, title: string): Locator => page.getByRole('main').getByRole('row').filter({ hasText: title });

// Lists page 20 records at a time in the API's order, so a new record may be on a later
// page of a busy test database: follow "Next page" until its row appears.
async function openListAt(page: Page, kind: Kind, title: string): Promise<Locator> {
  await page.goto(adminPath(kind));
  for (let step = 0; step < 40; step += 1) {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const row = rowOf(page, title);
    if (await row.count()) return row;
    const next = page.getByRole('main').getByRole('link', { name: /^next$/i });
    if (!(await next.count())) break;
    // Load the next page directly, so each check sees a fully rendered list rather than
    // the previous page while a client-side transition is still loading.
    await page.goto((await next.getAttribute('href'))!);
  }
  throw new Error(`no row for "${title}" in the ${kind} list`);
}

test('a page that holds items gets its own sidebar section, named by the page', async ({ page }) => {
  const title = `Notes ${RUN_ID}`;
  const slug = `notes-${RUN_ID}`.toLowerCase();
  await createOk(api, 'Page', { title, slug, itemKind: 'Note' });
  await page.goto('/admin');
  const link = sidebar(page).getByRole('link', { name: new RegExp(`^${title}\\b`) });
  await expect(link).toHaveAttribute('href', `/admin/items/${slug}`);
  await link.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(page.getByRole('main').getByRole('link', { name: /^new note$/i })).toBeVisible();
});

test('a page that holds no items has no section', async ({ page }) => {
  const row = await createOk(api, 'Page', { title: `Plain ${RUN_ID}` });
  await page.goto('/admin');
  await expect(sidebar(page).getByRole('link', { name: new RegExp(`^Plain ${RUN_ID}`) })).toHaveCount(0);
  const response = await page.goto(`/admin/items/${row.slug}`);
  expect(response?.status()).toBeLessThan(500);
  await expect(page.getByText(/not found/i).first()).toBeVisible();
});

test('the sidebar lists the content types and marks the current one', async ({ page }) => {
  await page.goto(adminPath('Article'));
  for (const name of ['Dashboard', 'Pages', 'News', 'Products', 'Settings']) {
    await expect(sidebar(page).getByRole('link', { name: new RegExp(`^${name}\\b`) }), name).toBeVisible();
  }
  await expect(sidebar(page).getByRole('link', { name: /^News\b/ })).toHaveAttribute('aria-current', 'page');
  await expect(sidebar(page).locator('a[aria-current="page"]')).toHaveCount(1);
  await sidebar(page).getByRole('link', { name: /^Pages\b/ }).click();
  await expect(page).toHaveURL(`${BASE_URL}${adminPath('Page')}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pages');
});

for (const [kind, columns] of [
  ['Page', ['Title', 'Actions', 'Slug', 'Status', 'Updated']],
  ['Article', ['Title', 'Actions', 'Slug', 'Status', 'Published', 'Updated']],
  ['Product', ['Title', 'Actions', 'Slug', 'Status', 'Published', 'Updated']],
] as [Kind, string[]][]) {
  test(`${kind.toLowerCase()} records are listed in a table with the specified columns`, async ({ page }) => {
    const row = await createOk(api, kind, { title: `Tabled ${kind} ${RUN_ID}` });
    const record = await openListAt(page, kind, row.title);
    const headers = await page.getByRole('main').getByRole('columnheader').allTextContents();
    expect(headers.map(header => header.trim())).toEqual(columns);
    await expect(record).toHaveCount(1);
    await expect(record.getByText(/^draft$/i)).toBeVisible();
    await expect(record.getByRole('link', { name: row.title, exact: true })).toHaveAttribute('href', `${adminPath(kind)}/${encodeURIComponent(row.id)}`);
  });
}

test('timestamps read relatively, with the absolute time on focus and for screen readers', async ({ page }) => {
  const row = await createOk(api, 'Article', { title: `Timed ${RUN_ID}` });
  const record = await openListAt(page, 'Article', row.title);
  const time = record.locator('time').last();
  await expect(time).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/);
  await expect(time).toHaveText(/now|second|minute|ago/i);
  const year = String(new Date().getUTCFullYear());
  await expect(time, 'screen readers hear the absolute time').toHaveAttribute('aria-label', new RegExp(year));
  // Reach it with the keyboard: the row's Delete button, then Tab (status and an unset
  // publication time are not Tab stops).
  await record.getByRole('button', { name: `Delete “${row.title}”` }).focus();
  await page.keyboard.press('Tab');
  await expect(time, 'keyboard users can reach it').toBeFocused();
  await expect(record.getByText(new RegExp(year)), 'focus shows the absolute time').toBeVisible();
  // Move focus out of the timestamp (Tab may land on the copy button inside its card).
  await record.getByRole('link', { name: row.title, exact: true }).focus();
  await expect(record.getByText(new RegExp(year)), 'and hides it when focus moves away').toBeHidden();
});

test('each row opens from its title and is edited or deleted from its own actions cell', async ({ page }) => {
  const row = await createOk(api, 'Article', { title: `Row actions ${RUN_ID}` });
  await (await openListAt(page, 'Article', row.title)).getByRole('link', { name: row.title, exact: true }).click();
  await expect(page).toHaveURL(`${BASE_URL}${adminPath('Article')}/${encodeURIComponent(row.id)}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(row.title);

  await (await openListAt(page, 'Article', row.title)).getByRole('link', { name: `Edit “${row.title}”` }).click();
  await expect(page).toHaveURL(`${BASE_URL}${adminPath('Article')}/${encodeURIComponent(row.id)}/edit`);
  await expect(page.getByLabel('Title')).toHaveValue(row.title);

  const remove = (await openListAt(page, 'Article', row.title)).getByRole('button', { name: `Delete “${row.title}”` });
  await remove.click();
  const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
  await expect(dialog).toContainText(row.title);
  await dialog.getByRole('button', { name: /cancel/i }).click();
  await expect(dialog).toBeHidden();
  expect(await byId(api, 'Article', row.id), 'cancelling keeps the record').not.toBeNull();

  await remove.click();
  await dialog.getByRole('button', { name: /^delete$/i }).click();
  await expect(page.getByRole('status').filter({ hasText: /deleted/i }), 'the deletion is announced').toBeVisible();
  await expect(page, 'deleting from the list stays on the list').toHaveURL(new RegExp(`^${BASE_URL}${adminPath('Article')}(\\?|$)`));
  await expect(rowOf(page, row.title)).toHaveCount(0);
  await expect.poll(async () => byId(api, 'Article', row.id)).toBeNull();
  await expect(page.getByRole('heading', { level: 1 }), 'focus does not fall to the page').toBeFocused();
});

test('"New <type>" opens an empty form for the type', async ({ page }) => {
  await page.goto(adminPath('Product'));
  await page.getByRole('main').getByRole('link', { name: /^new product$/i }).click();
  await expect(page).toHaveURL(`${BASE_URL}${adminPath('Product')}/new`);
  await expect(page.getByLabel('Title')).toHaveValue('');
  await expect(page.getByLabel('Enquiry URL')).toBeVisible();
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

  test('row actions stay in view and the sidebar opens from a menu button', async ({ page }) => {
    const row = await createOk(api, 'Article', { title: `Phone ${RUN_ID}` });
    await openListAt(page, 'Article', row.title);
    for (const name of [`Edit “${row.title}”`, `Delete “${row.title}”`]) {
      const action = rowOf(page, row.title).getByRole(name.startsWith('Delete') ? 'button' : 'link', { name });
      const box = await action.boundingBox();
      expect(box, name).not.toBeNull();
      expect(box!.x + box!.width, `${name} is within the screen`).toBeLessThanOrEqual(360);
      expect(box!.height, `${name} touch target`).toBeGreaterThanOrEqual(44);
    }
    // AppShell moves the sidebar's items into the top bar's drawer on phones.
    await page.getByRole('button', { name: /open navigation/i }).click();
    await expect(page.getByRole('dialog').getByRole('link', { name: /^Products\b/ })).toBeVisible();
  });
});

test('columns sort the listed records and say how they are sorted', async ({ page }) => {
  await createOk(api, 'Page', { title: `Sortable A ${RUN_ID}` });
  await createOk(api, 'Page', { title: `Sortable B ${RUN_ID}` });
  await page.goto(adminPath('Page'));
  const header = page.getByRole('main').getByRole('columnheader', { name: 'Sort by Title' });
  const titles = (): Promise<string[]> => page.getByRole('main').getByRole('row').locator('td:first-child a').allTextContents();
  const collate = (values: string[]): string[] => [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  await header.getByRole('button', { name: 'Sort by Title' }).click();
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  expect(await titles()).toEqual(collate(await titles()));
  await header.getByRole('button', { name: 'Sort by Title' }).click();
  await expect(header).toHaveAttribute('aria-sort', 'descending');
  expect(await titles()).toEqual(collate(await titles()).reverse());
});

test('the dashboard draft count opens the list filtered to drafts', async ({ page }) => {
  await createOk(api, 'Article', { title: `Filter draft ${RUN_ID}` });
  await page.goto('/admin');
  const drafts = page.getByRole('main').locator(`a[href="${adminPath('Article')}?status=draft"]`);
  await expect(drafts).toHaveText(/^\d+ drafts?$/);
  await drafts.click();
  await expect(page).toHaveURL(`${BASE_URL}${adminPath('Article')}?status=draft`);
  await expect(page.getByRole('main').getByText(/showing drafts only/i)).toBeVisible();
  const statuses = await page.getByRole('main').getByRole('row').locator('td').filter({ hasText: /^(Draft|Published)$/ }).allTextContents();
  expect(statuses.length).toBeGreaterThan(0);
  expect(new Set(statuses)).toEqual(new Set(['Draft']));
  await page.getByRole('main').getByRole('link', { name: /^show all news$/i }).click();
  await expect(page).toHaveURL(`${BASE_URL}${adminPath('Article')}`);
});

test('the edit screen publishes from its side panel, only once changes are saved', async ({ page }) => {
  const row = await createOk(api, 'Page', { title: `Panel ${RUN_ID}` });
  await page.goto(`${adminPath('Page')}/${encodeURIComponent(row.id)}/edit`);
  const panel = page.getByRole('complementary', { name: 'Publishing' });
  await expect(panel.getByText('Status: Draft')).toBeVisible();
  await page.getByLabel('Title').fill(`${row.title} changed`);
  await expect(panel.getByRole('button', { name: 'Publish' }), 'unsaved changes must be saved first').toBeDisabled();
  await page.getByLabel('Title').fill(row.title);
  await panel.getByRole('button', { name: 'Publish' }).click();
  await expect(panel.getByText('Status: Published')).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Unpublish' })).toBeEnabled();
  await expect.poll(async () => (await byId(api, 'Page', row.id))?.status).toBe('PUBLISHED');
});

test('rows publish and unpublish from their actions cell', async ({ page }) => {
  const row = await createOk(api, 'Product', { title: `Row publish ${RUN_ID}` });
  const record = await openListAt(page, 'Product', row.title);
  await record.getByRole('button', { name: `Publish “${row.title}”` }).click();
  await expect(record.getByRole('button', { name: `Unpublish “${row.title}”` })).toBeVisible();
  await expect(record.getByText(/^Published$/)).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /published/i })).toBeVisible();
  await expect.poll(async () => (await byId(api, 'Product', row.id))?.status).toBe('PUBLISHED');
});

test('status links and title search narrow the list through the URL', async ({ page }) => {
  await page.goto(`${adminPath('Page')}?status=draft`);
  const filters = page.getByRole('navigation', { name: 'Filter by status' });
  await expect(filters.getByRole('link', { name: 'Drafts' })).toHaveAttribute('aria-current', 'page');
  await expect(filters.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current', 'page');
  await filters.getByRole('link', { name: 'All' }).click();
  await expect(page).toHaveURL(`${BASE_URL}${adminPath('Page')}`);

  const first = await createOk(api, 'Page', { title: `Findable ${RUN_ID}` });
  await page.goto(adminPath('Page'));
  await page.getByRole('search').getByLabel('Search titles').fill(`findable ${RUN_ID}`);
  await page.getByRole('search').getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(new RegExp(`\\?q=`));
  await expect(page.getByRole('main').getByText(/matching/i)).toBeVisible();
  const titles = await page.getByRole('main').getByRole('row').locator('td:first-child a').allTextContents();
  expect(titles.every(title => title.toLowerCase().includes(`findable ${RUN_ID}`.toLowerCase())), titles.join(', ')).toBe(true);
  expect(first.title).toContain('Findable');
});

test('the dashboard lists recently edited records, newest first', async ({ page }) => {
  const row = await createOk(api, 'Page', { title: `Recent ${RUN_ID}` });
  await page.goto('/admin');
  const recent = page.getByRole('region', { name: 'Recently edited' });
  await expect(recent.getByRole('listitem').first()).toContainText(row.title);
  await recent.getByRole('link', { name: row.title }).click();
  await expect(page).toHaveURL(`${BASE_URL}${adminPath('Page')}/${encodeURIComponent(row.id)}`);
});

test('the page form places a page in the navigation and on the home page', async ({ page }) => {
  const row = await createOk(api, 'Page', { title: `Placed ${RUN_ID}` });
  await page.goto(`${adminPath('Page')}/${encodeURIComponent(row.id)}/edit`);
  const placement = page.getByRole('group', { name: 'Placement' });
  await expect(placement.getByRole('checkbox', { name: 'Show in navigation' })).toBeChecked();
  await expect(placement.getByRole('checkbox', { name: 'Feature on home page' })).not.toBeChecked();
  await placement.getByRole('checkbox', { name: 'Show in navigation' }).uncheck();
  await placement.getByRole('checkbox', { name: 'Feature on home page' }).check();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'correct the highlighted fields' }), 'a featured page needs a colour').toBeVisible();
  await expect(placement.getByRole('radiogroup', { name: 'Colour' }).getByRole('radio', { name: /^None/ })).toBeFocused();
  await placement.getByRole('radio', { name: 'Orange' }).check();
  await placement.getByRole('spinbutton', { name: 'Home order' }).fill('7');
  await placement.getByRole('spinbutton', { name: 'Home order' }).press('Tab');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved successfully.' })).toBeVisible();
  const saved = await api.ok('query($id: ID!) { page(id: $id) { showInNavigation featureOnHome homeOrder accent } }', { id: row.id });
  expect(saved.page).toEqual({ showInNavigation: false, featureOnHome: true, homeOrder: 7, accent: 'ORANGE' });
});
