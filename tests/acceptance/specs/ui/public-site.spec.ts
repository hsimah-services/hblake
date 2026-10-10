import { expect, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import {
  type Content,
  createOk,
  createPublished,
  ensurePage,
  pageOf,
  publicPath,
  uniqueSlug,
  unpublishOk,
  walk,
} from '../../lib/content.ts';
import { BASE_URL, RUN_ID } from '../../lib/env.ts';
import { notFound, signIn, xssFired } from '../../lib/ui.ts';

// The public site (website.md): client-rendered pages, lists, navigation, safe
// Markdown, metadata and the not-found state (acceptance 9 and 10).

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
});

test.afterAll(async () => {
  await api.dispose();
});

test.describe('home', () => {
  let home: Content;

  test.beforeAll(async () => {
    home = await ensurePage(api, 'home', 'PUBLISHED', { title: 'Welcome', content: '# Welcome\n\nHome page body.' });
  });

  test('/ renders the published home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: home.title, level: 1 })).toBeVisible();
  });

  test('/pages/home redirects to the canonical /', async ({ page }) => {
    await page.goto('/pages/home');
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.getByRole('heading', { name: home.title, level: 1 })).toBeVisible();
  });
});

test.describe('content pages', () => {
  test('a published post renders its Markdown and metadata', async ({ page }) => {
    const post = await createPublished(api, 'Post', {
      title: `Rendered ${RUN_ID}`,
      excerpt: `A summary for ${RUN_ID}.`,
      content: `Intro paragraph.\n\n## Section ${RUN_ID}\n\nSome **strong** words and a [link](https://example.com/).`,
    });
    await page.goto(publicPath('Post', post.slug));
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: post.title, level: 1 })).toBeVisible();
    await expect(main.getByRole('heading', { name: `Section ${RUN_ID}`, level: 2 })).toBeVisible();
    await expect(main.locator('strong', { hasText: 'strong' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'link' })).toHaveAttribute('href', 'https://example.com/');

    await expect(page).toHaveTitle(new RegExp(post.title));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', post.excerpt);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${BASE_URL}${publicPath('Post', post.slug)}`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', new RegExp(post.title));
  });

  test('Markdown is rendered with raw HTML disabled and unsafe URLs removed', async ({ page }) => {
    const post = await createPublished(api, 'Post', {
      title: `Hostile ${RUN_ID}`,
      content: [
        'Safe text.',
        '<script>window.__xss = "script"</script>',
        '<img src="x" onerror="window.__xss = \'img\'">',
        '<b id="raw-html">raw bold</b>',
        '[bad link](javascript:window.__xss="link")',
        '[data link](data:text/html,<script>parent.__xss=1</script>)',
        '![bad image](javascript:window.__xss="image")',
      ].join('\n\n'),
    });
    await page.goto(publicPath('Post', post.slug));
    const main = page.getByRole('main');
    await expect(main.getByText('Safe text.')).toBeVisible();

    expect(await xssFired(page)).toBe(false);
    await expect(main.locator('script')).toHaveCount(0);
    await expect(main.locator('[onerror], [onclick], [onload]')).toHaveCount(0);
    await expect(main.locator('#raw-html')).toHaveCount(0);
    await expect(main.locator('a[href^="javascript:" i], a[href^="data:" i], img[src^="javascript:" i]')).toHaveCount(0);
  });

  test('unknown and unpublished content render the same not-found state', async ({ page }) => {
    const draft = await createOk(api, 'Post', { title: `Unreleased ${RUN_ID}` });
    const unpublished = await createPublished(api, 'Page', { title: `Withdrawn ${RUN_ID}` });
    await unpublishOk(api, 'Page', unpublished.id);

    for (const path of [
      `/posts/missing-${RUN_ID}`,
      `/pages/missing-${RUN_ID}`,
      `/products/missing-${RUN_ID}`,
      publicPath('Post', draft.slug),
      publicPath('Page', unpublished.slug),
    ]) {
      await page.goto(path);
      await expect(notFound(page), path).toBeVisible();
    }
    await page.goto(publicPath('Post', draft.slug));
    await expect(page.getByText(draft.title)).toHaveCount(0);
  });

  test('the signed-in operator can preview a draft at its public URL', async ({ page }) => {
    const draft = await createOk(api, 'Post', { title: `Preview ${RUN_ID}` });
    await signIn(page);
    await page.goto(publicPath('Post', draft.slug));
    await expect(page.getByRole('heading', { name: draft.title, level: 1 })).toBeVisible();
  });
});

test.describe('products', () => {
  test('an enquiry link is shown only when the product has one', async ({ page }) => {
    const https = await createPublished(api, 'Product', { enquiryUrl: 'https://example.com/enquire' });
    const mailto = await createPublished(api, 'Product', { enquiryUrl: 'mailto:hello@example.com' });
    const none = await createPublished(api, 'Product');

    await page.goto(publicPath('Product', https.slug));
    await expect(page.getByRole('main').getByRole('link', { name: /enquir/i })).toHaveAttribute('href', 'https://example.com/enquire');
    await page.goto(publicPath('Product', mailto.slug));
    await expect(page.getByRole('main').getByRole('link', { name: /enquir/i })).toHaveAttribute('href', 'mailto:hello@example.com');
    await page.goto(publicPath('Product', none.slug));
    await expect(page.getByRole('heading', { name: none.title, level: 1 })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: /enquir/i })).toHaveCount(0);
  });

  test('the product list is ordered by title', async ({ page }) => {
    const b = await createPublished(api, 'Product', { title: `00 ${RUN_ID} beta` });
    const a = await createPublished(api, 'Product', { title: `00 ${RUN_ID} alpha` });
    await page.goto('/products');
    const links = page.getByRole('main').getByRole('link', { name: new RegExp(`00 ${RUN_ID}`) });
    await expect(links).toContainText([a.title, b.title]);
    await expect(links.first()).toHaveAttribute('href', publicPath('Product', a.slug));
  });
});

test.describe('post list', () => {
  test('lists published posts newest first and links to them', async ({ page }) => {
    const draft = await createOk(api, 'Post', { title: `Listed draft ${RUN_ID}` });
    const older = await createPublished(api, 'Post', { title: `Listed older ${RUN_ID}` });
    const newer = await createPublished(api, 'Post', { title: `Listed newer ${RUN_ID}` });
    await page.goto('/posts');
    const main = page.getByRole('main');
    const ours = main.getByRole('link', { name: new RegExp(`Listed (older|newer|draft) ${RUN_ID}`) });
    await expect(ours).toContainText([newer.title, older.title]);
    await expect(main.getByText(draft.title)).toHaveCount(0);
    await ours.first().click();
    await expect(page).toHaveURL(`${BASE_URL}${publicPath('Post', newer.slug)}`);
  });

  test('more than one page of posts offers a next page through the URL cursor', async ({ page }) => {
    const { totalCount } = await pageOf(api, 'Post');
    for (let i = totalCount; i < 21; i += 1) await createPublished(api, 'Post');
    await page.goto('/posts');
    const next = page.getByRole('link', { name: /next|older|more/i }).or(page.getByRole('button', { name: /next|older|more/i }));
    await next.first().click();
    await expect(page).toHaveURL(/[?&]after=/);
    await expect(page.getByRole('main').getByRole('link').first()).toBeVisible();
  });
});

test.describe('navigation', () => {
  test('links to published pages and non-empty collections only', async ({ page }) => {
    await ensurePage(api, 'services', 'PUBLISHED', { title: 'Services' });
    await ensurePage(api, 'about', 'DRAFT', { title: 'About' });
    await page.goto('/');
    await expect(page.locator('nav a[href="/pages/services"]').first()).toBeVisible();
    await expect(page.locator('nav a[href="/pages/about"]')).toHaveCount(0);
    await expect(page.locator('nav a[href="/posts"]').first()).toBeVisible();
    await expect(page.locator('nav a[href="/products"]').first()).toBeVisible();
  });

  test('every public route has a consistent header, navigation and footer', async ({ page }) => {
    const post = await createPublished(api, 'Post');
    for (const path of ['/', '/posts', '/products', publicPath('Post', post.slug), `/pages/missing-${uniqueSlug()}`]) {
      await page.goto(path);
      await expect(page.getByRole('banner'), `${path} header`).toBeVisible();
      await expect(page.getByRole('navigation').first(), `${path} navigation`).toBeVisible();
      await expect(page.getByRole('contentinfo'), `${path} footer`).toBeVisible();
    }
  });
});

test.describe('navigation across list pages', () => {
  test('later pages of a list keep the same site navigation', async ({ page }) => {
    // website.md: the Products link depends only on whether published products exist,
    // not on how far through the post list the visitor has paged.
    if ((await walk(api, 'Product')).nodes.every(node => node.status !== 'PUBLISHED')) await createPublished(api, 'Product');
    const products = (await walk(api, 'Product')).totalCount;
    const pagesPastProducts = Math.ceil(products / 20) + 1;
    const posts = async (): Promise<number> => (await walk(api, 'Post')).nodes.filter(node => node.status === 'PUBLISHED').length;
    for (let i = await posts(); i < pagesPastProducts * 20 + 1; i += 1) await createPublished(api, 'Post');

    await page.goto('/posts');
    const productsLink = page.locator('nav a[href="/products"]').first();
    await expect(productsLink, '/posts links to /products').toBeVisible();
    for (let step = 1; step <= pagesPastProducts; step += 1) {
      const url = page.url();
      await page.getByRole('link', { name: /next|older|more/i }).or(page.getByRole('button', { name: /next|older|more/i })).first().click();
      await expect(page).not.toHaveURL(url);
      await expect(page).toHaveURL(/[?&]after=/);
      await expect(page.getByRole('main').getByRole('link').first()).toBeVisible();
      await expect(productsLink, `post list page ${step + 1} still links to /products`).toBeVisible();
    }
  });
});

test.describe('client-side routing', () => {
  test('following site links does not reload the document', async ({ page }) => {
    const post = await createPublished(api, 'Post');
    await page.goto('/');
    await page.evaluate(() => ((window as unknown as { __document?: string }).__document = 'first-load'));
    const sameDocument = (): Promise<boolean> =>
      page.evaluate(() => (window as unknown as { __document?: string }).__document === 'first-load');

    await page.locator('nav a[href="/posts"]').first().click();
    await expect(page).toHaveURL(`${BASE_URL}/posts`);
    expect(await sameDocument(), 'navigation link handled by the router').toBe(true);

    await page.getByRole('main').locator(`a[href="${publicPath('Post', post.slug)}"]`).first().click();
    await expect(page).toHaveURL(`${BASE_URL}${publicPath('Post', post.slug)}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(post.title);
    expect(await sameDocument(), 'list link handled by the router').toBe(true);
  });
});
