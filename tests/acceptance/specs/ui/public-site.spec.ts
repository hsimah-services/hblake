import { expect, test, type Page, type Request } from '@playwright/test';

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
import { BASE_URL, OPERATOR, RUN_ID } from '../../lib/env.ts';
import { contrastOf, notFound, signIn, xssFired } from '../../lib/ui.ts';

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
    await expect(main.getByText(`By ${OPERATOR.displayName}`), 'the author byline').toBeVisible();
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
      `/news/missing-${RUN_ID}`,
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

test.describe('news details', () => {
  test('articles show their date and reading time, and link to newer and older news', async ({ page }) => {
    const older = await createPublished(api, 'Post', { title: `Older story ${RUN_ID}`, content: `${'word '.repeat(450)}end.` });
    const newer = await createPublished(api, 'Post', { title: `Newer story ${RUN_ID}` });
    await page.goto(publicPath('Post', older.slug));
    const byline = page.getByRole('main').getByText(/^By .* min read$/);
    await expect(byline).toContainText('2 min read');
    await expect(byline.locator('time')).toHaveAttribute('datetime', older.publishedAt!);
    const more = page.getByRole('navigation', { name: 'More news' });
    await expect(more.getByRole('link', { name: newer.title })).toHaveAttribute('href', publicPath('Post', newer.slug));
    await page.goto(publicPath('Post', newer.slug));
    await expect(page.getByRole('navigation', { name: 'More news' }).getByRole('link', { name: older.title })).toBeVisible();

    await page.goto('/news');
    const item = page.getByRole('main').locator('article', { has: page.getByRole('link', { name: newer.title }) });
    await expect(item.locator('time')).toHaveAttribute('datetime', newer.publishedAt!);
    await expect(item).toContainText(/\d+ min read/);
  });
});

test.describe('post list', () => {
  test('lists published posts newest first and links to them', async ({ page }) => {
    const draft = await createOk(api, 'Post', { title: `Listed draft ${RUN_ID}` });
    const older = await createPublished(api, 'Post', { title: `Listed older ${RUN_ID}` });
    const newer = await createPublished(api, 'Post', { title: `Listed newer ${RUN_ID}` });
    await page.goto('/news');
    const main = page.getByRole('main');
    const ours = main.getByRole('link', { name: new RegExp(`Listed (older|newer|draft) ${RUN_ID}`) });
    await expect(ours).toContainText([newer.title, older.title]);
    await expect(main.getByText(draft.title)).toHaveCount(0);
    await expect(main.locator('article', { has: page.getByRole('link', { name: newer.title }) })).toContainText(`By ${OPERATOR.displayName}`);
    await ours.first().click();
    await expect(page).toHaveURL(`${BASE_URL}${publicPath('Post', newer.slug)}`);
  });

  test('more than one page of posts offers a next page through the URL cursor', async ({ page }) => {
    const { totalCount } = await pageOf(api, 'Post');
    for (let i = totalCount; i < 21; i += 1) await createPublished(api, 'Post');
    await page.goto('/news');
    const next = page.getByRole('link', { name: /next|older|more/i }).or(page.getByRole('button', { name: /next|older|more/i }));
    await next.first().click();
    await expect(page).toHaveURL(/[?&]after=/);
    await expect(page.getByRole('main').getByRole('link').first()).toBeVisible();
  });
});

// The navigation underline is a centred 2px gradient whose width is the cue: drawn in
// full under the current link and on hover or focus, zero width otherwise.
const underline = (link: import('@playwright/test').Locator): Promise<string> => link.evaluate(element => {
  const style = getComputedStyle(element);
  return style.backgroundImage.includes('gradient') ? style.backgroundSize : 'none';
});

test.describe('page placement', () => {
  const tiles = (page: Page) => page.getByRole('region', { name: 'Explore the site' }).getByRole('link');
  const navLink = (page: Page, slug: string) => page.getByRole('navigation', { name: 'Main navigation' }).locator(`a[href="/pages/${slug}"]`);

  test('pages appear in the navigation and as home tiles only as placed, and drafts never do', async ({ page }) => {
    await ensurePage(api, 'home', 'PUBLISHED', { title: 'Welcome', content: '# Welcome\n\nHome page body.' });
    const navOnly = await createPublished(api, 'Page', { title: `Nav only ${RUN_ID}` });
    const tile = await createPublished(api, 'Page', { title: `Tiled ${RUN_ID}`, featureOnHome: true, homeOrder: 0, accent: 'ORANGE', showInNavigation: false });
    const draft = await createOk(api, 'Page', { title: `Placed draft ${RUN_ID}`, featureOnHome: true, homeOrder: 0, accent: 'BLUE' });
    await page.goto('/');
    await expect(navLink(page, navOnly.slug), 'shown in the navigation').toBeVisible();
    await expect(tiles(page).filter({ hasText: navOnly.title }), 'not a tile').toHaveCount(0);
    await expect(tiles(page).filter({ hasText: tile.title }), 'featured as a tile').toHaveCount(1);
    await expect(navLink(page, tile.slug), 'hidden from the navigation').toHaveCount(0);
    await expect(navLink(page, draft.slug)).toHaveCount(0);
    await expect(tiles(page).filter({ hasText: draft.title }), 'drafts are never tiles').toHaveCount(0);
  });

  test('at most four tiles show, by home order then title', async ({ page }) => {
    await ensurePage(api, 'home', 'PUBLISHED', { title: 'Welcome', content: '# Welcome\n\nHome page body.' });
    // "A0 …" sorts before other tests' tiles at home order 0 (such as About).
    const titles = ['A', 'B', 'C', 'D', 'E'].map(letter => `A0 Cap ${letter} ${RUN_ID}`);
    for (const title of titles.reverse()) await createPublished(api, 'Page', { title, featureOnHome: true, homeOrder: 0, accent: 'GREEN' });
    await page.goto('/');
    await expect(tiles(page)).toHaveCount(4);
    const shown = await tiles(page).allTextContents();
    expect(shown.map(text => text.match(/Cap [A-E]/)?.[0])).toEqual(['Cap A', 'Cap B', 'Cap C', 'Cap D']);
  });
});

test.describe('navigation', () => {
  test('links to published pages and non-empty collections only', async ({ page }) => {
    await ensurePage(api, 'services', 'PUBLISHED', { title: 'Services' });
    await ensurePage(api, 'about', 'DRAFT', { title: 'About' });
    await page.goto('/');
    await expect(page.locator('nav a[href="/pages/services"]').first()).toBeVisible();
    await expect(page.locator('nav a[href="/pages/about"]')).toHaveCount(0);
    await expect(page.locator('nav a[href="/news"]').first()).toBeVisible();
    await expect(page.locator('nav a[href="/products"]').first()).toBeVisible();
  });

  test('the navigation marks the current page and section', async ({ page }) => {
    await ensurePage(api, 'services', 'PUBLISHED', { title: 'Services' });
    const post = await createPublished(api, 'Post');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    const current = nav.locator('a[aria-current]');
    for (const [path, href, value] of [
      ['/', '/', 'page'],
      ['/pages/services', '/pages/services', 'page'],
      ['/news', '/news', 'page'],
      [publicPath('Post', post.slug), '/news', 'true'],
    ] as const) {
      await page.goto(path);
      await expect(current, `${path}: one current link`).toHaveCount(1);
      await expect(current, path).toHaveAttribute('href', href);
      await expect(current, path).toHaveAttribute('aria-current', value);
    }
    await page.goto(`/pages/missing-${uniqueSlug()}`);
    await expect(current, 'an unknown page matches no link').toHaveCount(0);
  });

  test('the current page is marked by more than colour', async ({ page }) => {
    await ensurePage(api, 'services', 'PUBLISHED', { title: 'Services' });
    await ensurePage(api, 'portfolio', 'PUBLISHED', { title: 'Portfolio' });
    await page.goto('/pages/services');
    const current = page.getByRole('navigation', { name: 'Main navigation' }).locator('a[aria-current="page"]');
    const other = page.getByRole('navigation', { name: 'Main navigation' }).locator('a[href="/pages/portfolio"]');
    await page.mouse.move(0, 0);
    expect(await underline(current), 'the current link keeps its underline drawn').toBe('100% 2px');
    expect(await underline(other), 'other links are not underlined until hovered').toBe('0% 2px');
  });

  test('the home icon is never underlined or highlighted, even at home', async ({ page }) => {
    await page.goto('/');
    const home = page.getByRole('navigation', { name: 'Main navigation' }).locator('a[href="/"]');
    await expect(home, 'assistive technology still hears the current page').toHaveAttribute('aria-current', 'page');
    await page.mouse.move(0, 0);
    expect(await underline(home)).toBe('none');
    expect(await home.evaluate(element => getComputedStyle(element).backgroundColor), 'no current tint').toBe('rgba(0, 0, 0, 0)');
    await home.hover();
    expect(await underline(home), 'not on hover either').toBe('none');
  });

  test('every public route has a consistent header, navigation and footer', async ({ page }) => {
    const post = await createPublished(api, 'Post');
    for (const path of ['/', '/news', '/products', publicPath('Post', post.slug), `/pages/missing-${uniqueSlug()}`]) {
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

    await page.goto('/news');
    const productsLink = page.locator('nav a[href="/products"]').first();
    await expect(productsLink, '/news links to /products').toBeVisible();
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

    await page.locator('nav a[href="/news"]').first().click();
    await expect(page).toHaveURL(`${BASE_URL}/news`);
    expect(await sameDocument(), 'navigation link handled by the router').toBe(true);

    await page.getByRole('main').locator(`a[href="${publicPath('Post', post.slug)}"]`).first().click();
    await expect(page).toHaveURL(`${BASE_URL}${publicPath('Post', post.slug)}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(post.title);
    expect(await sameDocument(), 'list link handled by the router').toBe(true);
  });

  // Whether a /graphql request body carries the named operation, by name or by its text.
  const isOperation = (body: string | null, name: string): boolean =>
    new RegExp(`"operationName":"${name}"|\\b(query|mutation) ${name}\\b`).test(body ?? '');

  test('hovering a link before following it fetches the route query once', async ({ page }) => {
    await createPublished(api, 'Post');
    const isPostList = (request: Request): boolean =>
      new URL(request.url()).pathname === '/graphql' && isOperation(request.postData(), 'PostListQuery');
    const postLists: Request[] = [];
    page.on('request', request => { if (isPostList(request)) postLists.push(request); });
    await page.goto('/');
    const link = page.locator('nav a[href="/news"]').first();
    await link.hover();
    // Let any hover preload finish before following the link.
    await page.waitForResponse(response => isPostList(response.request()), { timeout: 3_000 }).catch(() => undefined);
    await link.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('News');
    await page.waitForLoadState('networkidle');
    expect(postLists, 'one PostListQuery request for one navigation').toHaveLength(1);
  });

  test('a route query that returns errors is not shown as missing content', async ({ page }) => {
    // A resolver failure yields partial data: every route field null, plus errors.
    const post = await createPublished(api, 'Post');
    await page.route('**/graphql', async route => {
      if (!isOperation(route.request().postData(), 'PostQuery')) return route.continue();
      const response = await route.fetch();
      const { data } = await response.json() as { data: Record<string, unknown> };
      await route.fulfill({ response, json: {
        data: Object.fromEntries(Object.keys(data).map(field => [field, null])),
        errors: [{ message: 'Internal server error' }],
      } });
    });
    await page.goto('/news');
    await page.getByRole('main').locator(`a[href="${publicPath('Post', post.slug)}"]`).first().click();
    await expect(page).toHaveURL(`${BASE_URL}${publicPath('Post', post.slug)}`);
    await expect(page.getByText(/error|went wrong|try again|could not/i).first()).toBeVisible();
    await expect(notFound(page)).toHaveCount(0);
    expect(await page.title()).not.toMatch(/not found/i);
  });
});

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`readable in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test('headings, body text, links and buttons meet WCAG AA contrast', async ({ page }) => {
      // website.md: public and admin UI follow the system colour scheme legibly.
      const post = await createPublished(api, 'Post');
      for (const path of ['/', '/news', publicPath('Post', post.slug), '/admin/login']) {
        await page.goto(path);
        const targets = [
          page.getByRole('heading', { level: 1 }),
          page.getByRole('banner').getByRole('link').first(),
          page.getByRole('contentinfo').locator('p, a').first(),
        ];
        if (path === '/admin/login') targets.push(page.getByRole('button', { name: /sign in|log in/i }));
        else targets.push(page.getByRole('main').locator('p').first());
        for (const target of targets) {
          await expect(target).toBeVisible();
          const label = `${path} ${(await target.textContent())?.trim().slice(0, 30)}`;
          expect(await contrastOf(target), `${label} contrast`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  });
}

test.describe('document titles', () => {
  test('lists and the home page have descriptive titles', async ({ page }) => {
    await createPublished(api, 'Post');
    await createPublished(api, 'Product');
    for (const [path, title] of [['/news', /^News\b/], ['/products', /^Products\b/], ['/admin/login', /^Sign in\b/]] as const) {
      await page.goto(path);
      await expect(page, path).toHaveTitle(title);
    }
  });
});

test.describe('initial data', () => {
  test('public routes render from inlined data without a GraphQL request', async ({ page }) => {
    const post = await createPublished(api, 'Post');
    const product = await createPublished(api, 'Product');
    const routes: [string, string][] = [
      [publicPath('Post', post.slug), post.title],
      [publicPath('Product', product.slug), product.title],
      ['/news', 'News'],
    ];
    for (const [path, heading] of routes) {
      const requests: string[] = [];
      const listener = (request: { url(): string; method(): string }) => {
        if (new URL(request.url()).pathname === '/graphql') requests.push(`${request.method()} ${request.url()}`);
      };
      page.on('request', listener);
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      await page.waitForLoadState('networkidle');
      page.off('request', listener);
      expect(requests, `${path} rendered without fetching its route query`).toEqual([]);
    }
  });
});
