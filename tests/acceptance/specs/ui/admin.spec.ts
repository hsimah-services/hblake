import { expect, test, type Page } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import {
  KINDS,
  type Kind,
  adminPath,
  byId,
  bySlug,
  createOk,
  pageOf,
  uniqueSlug,
} from '../../lib/content.ts';
import { BASE_URL, OPERATOR, RUN_ID } from '../../lib/env.ts';
import { announcedError, confirmation, forbiddenControls, signIn, tabTo, xssFired } from '../../lib/ui.ts';

// Content administration (ui/admin.md, ui/admin.yml, acceptance 7). Field labels follow
// admin.yml: Title, Slug, Content, Excerpt and, for products, Enquiry URL.

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
});

test.afterAll(async () => {
  await api.dispose();
});

const idFromUrl = (page: Page, kind: Kind): string => {
  const match = new URL(page.url()).pathname.match(new RegExp(`^${adminPath(kind)}/([^/]+)$`));
  expect(match, `on a ${kind} detail URL, got ${page.url()}`).toBeTruthy();
  return decodeURIComponent(match![1]);
};

test.describe('access', () => {
  test('signed-out visitors are sent to the login page', async ({ page }) => {
    for (const path of ['/admin', '/admin/pages', '/admin/posts/new', '/admin/products']) {
      await page.goto(path);
      await expect(page, path).toHaveURL(`${BASE_URL}/admin/login`);
    }
  });

  test('a wrong password shows an announced error and keeps the visitor on the login page', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(OPERATOR.email);
    await page.getByLabel('Password').fill(`${OPERATOR.password}-wrong`);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(announcedError(page)).toBeVisible();
    await expect(page).toHaveURL(`${BASE_URL}/admin/login`);
    await expect(page.getByLabel('Email')).toHaveValue(OPERATOR.email);
  });

  test('signing in with the keyboard reaches the admin home with every section linked', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').focus();
    await page.keyboard.type(OPERATOR.email);
    await tabTo(page, page.getByLabel('Password'));
    await page.keyboard.type(OPERATOR.password);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(`${BASE_URL}/admin`);
    const main = page.getByRole('main');
    for (const href of ['/admin/pages', '/admin/posts', '/admin/products']) {
      await expect(main.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
    const viewer = (await api.viewer())!;
    await expect(main.locator(`a[href="/admin/users/${encodeURIComponent(viewer.id)}"], a[href="/admin/users/${viewer.id}"]`).first()).toBeVisible();
  });

  test('signing out ends the session', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin');
    await page.getByRole('button', { name: /sign out|log out/i }).or(page.getByRole('link', { name: /sign out|log out/i })).first().click();
    await page.goto('/admin/pages');
    await expect(page).toHaveURL(`${BASE_URL}/admin/login`);
  });
});

for (const kind of KINDS) {
  test.describe(`${kind} administration`, () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page);
    });

    test('create works by keyboard and lands on a draft detail view', async ({ page }) => {
      const slug = uniqueSlug(`ui-${kind.toLowerCase()}`);
      await page.goto(`${adminPath(kind)}/new`);
      await page.getByLabel('Title').focus();
      await page.keyboard.type(`Keyboard ${slug}`);
      await tabTo(page, page.getByLabel('Slug'));
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.type(slug);
      await tabTo(page, page.getByLabel('Content'));
      await page.keyboard.type('Written by keyboard.');
      await tabTo(page, page.getByLabel('Excerpt'));
      await page.keyboard.type('Keyboard excerpt.');
      await tabTo(page, page.getByRole('button', { name: /^(save|create)/i }), 20);
      await page.keyboard.press('Enter');

      await expect(confirmation(page)).toBeVisible();
      const id = idFromUrl(page, kind);
      await expect(page.getByRole('main').getByText(`Keyboard ${slug}`).first()).toBeVisible();
      await expect(page.getByRole('main').getByText(/draft/i).first()).toBeVisible();
      expect(await byId(api, kind, id)).toMatchObject({ slug, status: 'DRAFT', content: 'Written by keyboard.' });
    });

    test('forms accept only the allowlisted fields', async ({ page }) => {
      const expected = kind === 'Product' ? ['Title', 'Slug', 'Content', 'Excerpt', 'Enquiry URL'] : ['Title', 'Slug', 'Content', 'Excerpt'];
      const row = await createOk(api, kind);
      for (const path of [`${adminPath(kind)}/new`, `${adminPath(kind)}/${encodeURIComponent(row.id)}/edit`]) {
        await page.goto(path);
        for (const label of expected) await expect(page.getByLabel(label).first(), `${path} ${label}`).toBeVisible();
        await expect(page.getByLabel('Content').first()).toHaveJSProperty('tagName', 'TEXTAREA');
        await expect(forbiddenControls(page), `${path} has no status, timestamp or id inputs`).toHaveCount(0);
      }
    });

    test('validation errors are announced, focus the first invalid field and keep input', async ({ page }) => {
      await page.goto(`${adminPath(kind)}/new`);
      const title = `Invalid ${RUN_ID}`;
      await page.getByLabel('Title').fill(title);
      await page.getByLabel('Slug').fill('Not A Valid Slug');
      await page.getByLabel('Content').fill('Some body text.');
      await page.getByRole('button', { name: /^(save|create)/i }).click();

      await expect(announcedError(page).first()).toBeVisible();
      await expect(page.getByLabel('Slug')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByLabel('Slug')).toBeFocused();
      await expect(page).toHaveURL(`${BASE_URL}${adminPath(kind)}/new`);
      await expect(page.getByLabel('Title')).toHaveValue(title);
      await expect(page.getByLabel('Slug')).toHaveValue('Not A Valid Slug');
      await expect(page.getByLabel('Content')).toHaveValue('Some body text.');
    });

    test('server-side rejections keep input too', async ({ page }) => {
      const taken = await createOk(api, kind);
      await page.goto(`${adminPath(kind)}/new`);
      await page.getByLabel('Title').fill(`Duplicate ${RUN_ID}`);
      await page.getByLabel('Slug').fill(taken.slug);
      await page.getByLabel('Content').fill('Duplicate slug body.');
      await page.getByRole('button', { name: /^(save|create)/i }).click();
      await expect(announcedError(page).first()).toBeVisible();
      await expect(page.getByLabel('Title')).toHaveValue(`Duplicate ${RUN_ID}`);
      await expect(page.getByLabel('Content')).toHaveValue('Duplicate slug body.');
    });

    test('the Markdown preview renders safely', async ({ page }) => {
      await page.goto(`${adminPath(kind)}/new`);
      await page.getByLabel('Content').fill(`## Preview ${RUN_ID}\n\n<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>`);
      const toggle = page.getByRole('tab', { name: /preview/i }).or(page.getByRole('button', { name: /preview/i }));
      if (await toggle.count()) await toggle.first().click();
      await expect(page.getByRole('heading', { name: `Preview ${RUN_ID}` })).toBeVisible();
      expect(await xssFired(page)).toBe(false);
    });

    test('edit saves changes and shows a confirmation', async ({ page }) => {
      const row = await createOk(api, kind);
      await page.goto(`${adminPath(kind)}/${encodeURIComponent(row.id)}/edit`);
      await expect(page.getByLabel('Title')).toHaveValue(row.title);
      await page.getByLabel('Title').fill(`${row.title} edited`);
      await page.getByRole('button', { name: /^save/i }).click();
      await expect(confirmation(page)).toBeVisible();
      await expect.poll(async () => (await byId(api, kind, row.id))?.title).toBe(`${row.title} edited`);
    });

    test('publish and unpublish are separate actions on the detail view', async ({ page }) => {
      const row = await createOk(api, kind);
      await page.goto(`${adminPath(kind)}/${encodeURIComponent(row.id)}`);
      await expect(page.getByRole('textbox')).toHaveCount(0);
      await page.getByRole('button', { name: /^publish$/i }).click();
      await expect(page.getByRole('button', { name: /^unpublish$/i })).toBeVisible();
      await expect(page.getByRole('main').getByText(/published/i).first()).toBeVisible();
      await expect.poll(async () => (await byId(api, kind, row.id))?.status).toBe('PUBLISHED');

      await page.getByRole('button', { name: /^unpublish$/i }).click();
      await expect(page.getByRole('button', { name: /^publish$/i })).toBeVisible();
      await expect.poll(async () => (await byId(api, kind, row.id))?.status).toBe('DRAFT');
    });

    test('delete asks for confirmation; cancelling keeps the record', async ({ page }) => {
      const row = await createOk(api, kind);
      await page.goto(`${adminPath(kind)}/${encodeURIComponent(row.id)}`);
      await page.getByRole('button', { name: /^delete/i }).click();
      const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: /cancel|keep|no/i }).click();
      await expect(dialog).toBeHidden();
      expect(await byId(api, kind, row.id)).not.toBeNull();

      await page.getByRole('button', { name: /^delete/i }).click();
      await dialog.getByRole('button', { name: /^(delete|confirm|yes)/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}${adminPath(kind)}`);
      await expect.poll(async () => byId(api, kind, row.id)).toBeNull();
      await expect(page.getByRole('main').getByText(row.title)).toHaveCount(0);
    });
  });
}

test.describe('forms in detail', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('an enquiry URL can be cleared', async ({ page }) => {
    const row = await createOk(api, 'Product', { enquiryUrl: 'https://example.com/clear-me' });
    await page.goto(`/admin/products/${encodeURIComponent(row.id)}/edit`);
    await expect(page.getByLabel('Enquiry URL')).toHaveValue('https://example.com/clear-me');
    await page.getByLabel('Enquiry URL').fill('');
    await page.getByRole('button', { name: /^save/i }).click();
    await expect(confirmation(page)).toBeVisible();
    await expect.poll(async () => (await byId(api, 'Product', row.id))?.enquiryUrl).toBeNull();
  });

  test('an excerpt can be cleared without touching other fields', async ({ page }) => {
    const row = await createOk(api, 'Post', { excerpt: 'Remove me.' });
    await page.goto(`/admin/posts/${encodeURIComponent(row.id)}/edit`);
    await page.getByLabel('Excerpt').fill('');
    await page.getByRole('button', { name: /^save/i }).click();
    await expect(confirmation(page)).toBeVisible();
    await expect.poll(async () => byId(api, 'Post', row.id)).toMatchObject({ excerpt: '', title: row.title, content: row.content });
  });

  test('the edit screen explains that changing the slug changes the URL', async ({ page }) => {
    const row = await createOk(api, 'Page');
    await page.goto(`/admin/pages/${encodeURIComponent(row.id)}/edit`);
    await expect(page.getByText(/url/i).filter({ hasText: /chang/i }).first()).toBeVisible();
  });

  test('a dirty form warns before navigating away', async ({ page }) => {
    const row = await createOk(api, 'Page');
    const editUrl = `${BASE_URL}/admin/pages/${encodeURIComponent(row.id)}/edit`;
    await page.goto(editUrl);
    await page.getByLabel('Title').fill(`${row.title} unsaved`);

    let nativePrompt = false;
    page.once('dialog', dialog => {
      nativePrompt = true;
      void dialog.dismiss();
    });
    await page.locator('a[href="/admin"], a[href="/admin/pages"]').first().click();
    const inAppPrompt = page.getByRole('alertdialog').or(page.getByRole('dialog'));
    await expect.poll(async () => nativePrompt || (await inAppPrompt.count()) > 0, { timeout: 5_000 }).toBe(true);
    if (!nativePrompt) await inAppPrompt.getByRole('button', { name: /stay|cancel|keep/i }).click();
    await expect(page).toHaveURL(editUrl);
    await expect(page.getByLabel('Title')).toHaveValue(`${row.title} unsaved`);
  });

  test('admin lists page in bounded steps with the cursor in the URL', async ({ page }) => {
    const { totalCount } = await pageOf(api, 'Post');
    for (let i = totalCount; i < 21; i += 1) await createOk(api, 'Post');
    await page.goto('/admin/posts');
    const records = page.getByRole('main').locator('a[href^="/admin/posts/"]');
    await expect(records.first()).toBeVisible();
    const ids = await records.evaluateAll(links =>
      [...new Set(links.map(link => link.getAttribute('href')!.split('/')[3]).filter(id => id && id !== 'new'))],
    );
    expect(ids.length, 'at most 20 records per page').toBeLessThanOrEqual(20);
    expect(ids.length).toBeGreaterThan(0);
    await page.getByRole('link', { name: /next|older|more/i }).or(page.getByRole('button', { name: /next|older|more/i })).first().click();
    await expect(page).toHaveURL(/\/admin\/posts\?(.*&)?after=/);
  });

  test('records created in the admin are not public until published', async ({ page }) => {
    const slug = uniqueSlug('ui-private');
    await page.goto('/admin/posts/new');
    await page.getByLabel('Title').fill(`Private ${slug}`);
    await page.getByLabel('Slug').fill(slug);
    await page.getByLabel('Content').fill('Not yet.');
    await page.getByRole('button', { name: /^(save|create)/i }).click();
    await expect(confirmation(page)).toBeVisible();
    const anonymous = await Api.anonymous();
    expect(await bySlug(anonymous, 'Post', slug)).toBeNull();
    await anonymous.dispose();
  });
});

test.describe('dialogs and routing', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('the delete confirmation is a modal dialog', async ({ page }) => {
    // WAI-ARIA modal dialog pattern: focus moves in, stays in, Escape closes, focus returns.
    const row = await createOk(api, 'Post');
    await page.goto(`${adminPath('Post')}/${encodeURIComponent(row.id)}`);
    const trigger = page.getByRole('button', { name: /^delete/i });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
    await expect(dialog).toBeVisible();
    const focusInDialog = (): Promise<boolean> =>
      dialog.evaluate(element => element.contains(document.activeElement));

    await expect.poll(focusInDialog, 'focus moves into the dialog').toBe(true);
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      expect(await focusInDialog(), `focus stays in the dialog after Tab ${i + 1}`).toBe(true);
    }
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Shift+Tab');
      expect(await focusInDialog(), `focus stays in the dialog after Shift+Tab ${i + 1}`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog, 'Escape closes the dialog').toBeHidden();
    await expect(trigger, 'focus returns to the Delete button').toBeFocused();
    expect(await byId(api, 'Post', row.id), 'Escape deletes nothing').not.toBeNull();
  });

  test('admin links do not reload the document', async ({ page }) => {
    const row = await createOk(api, 'Post');
    await page.goto('/admin');
    await page.evaluate(() => ((window as unknown as { __document?: string }).__document = 'first-load'));
    const sameDocument = (): Promise<boolean> =>
      page.evaluate(() => (window as unknown as { __document?: string }).__document === 'first-load');

    await page.getByRole('main').getByRole('link', { name: /^posts$/i }).click();
    await expect(page).toHaveURL(`${BASE_URL}${adminPath('Post')}`);
    expect(await sameDocument(), 'section link handled by the router').toBe(true);

    await page.goto(`${adminPath('Post')}/${encodeURIComponent(row.id)}`);
    await page.evaluate(() => ((window as unknown as { __document?: string }).__document = 'first-load'));
    await page.getByRole('link', { name: /^edit$/i }).click();
    await expect(page).toHaveURL(`${BASE_URL}${adminPath('Post')}/${encodeURIComponent(row.id)}/edit`);
    await expect(page.getByLabel('Title')).toHaveValue(row.title);
    expect(await sameDocument(), 'edit link handled by the router').toBe(true);
  });
});
