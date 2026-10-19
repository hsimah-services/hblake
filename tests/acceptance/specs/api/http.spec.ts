import { expect, request, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { createOk, createPublished, uniqueSlug } from '../../lib/content.ts';
import { BASE_URL } from '../../lib/env.ts';

// Secrets, the database, source and backups are unreachable over HTTP (acceptance 11).
// The SPA may answer unknown paths with its shell, so each response is checked for the
// file's contents rather than only for its status.

const PATHS = [
  '/.env',
  '/.env.local',
  '/.git/config',
  '/.git/HEAD',
  '/composer.json',
  '/composer.lock',
  '/eleph.json',
  '/package.json',
  '/vendor/autoload.php',
  '/spec/project.yml',
  '/spec/entities/User.yml',
  '/generated/Catalogue.php',
  '/src/Bootstrap.php',
  '/index.php.bak',
  '/database.sqlite',
  '/data.sqlite',
  '/hsimah.sqlite',
  '/db.sqlite3',
  '/var/data.sqlite',
  '/data/hsimah.sqlite',
  '/storage/database.sqlite',
  '/backups/',
  '/backup.sqlite',
];

const LEAKS: [string, RegExp][] = [
  ['SQLite database', /SQLite format 3/],
  ['PHP source', /<\?php/],
  ['git metadata', /\[core\]|^ref: refs\//m],
  ['Composer manifest', /"require"\s*:|"packages"\s*:/],
  ['Elephentity config or spec', /"targets"\s*:|^project:\s*Hsimah|^entity:\s*User/m],
  ['environment file', /^[A-Z][A-Z0-9_]*=.+/m],
  ['directory listing', /Index of \//],
];

test('sensitive files are not served', async () => {
  const ctx = await request.newContext({ baseURL: BASE_URL });
  const leaks: string[] = [];
  for (const path of PATHS) {
    const response = await ctx.get(path, { maxRedirects: 0 });
    if (response.status() >= 300) continue;
    const body = (await response.body()).subarray(0, 64 * 1024).toString('latin1');
    for (const [what, pattern] of LEAKS) if (pattern.test(body)) leaks.push(`${path} serves a ${what}`);
  }
  expect(leaks).toEqual([]);
  await ctx.dispose();
});

test('GraphQL introspection and queries are served on /graphql over POST', async () => {
  const ctx = await request.newContext({ baseURL: BASE_URL });
  const response = await ctx.post('/graphql', {
    data: { query: '{ __typename }' },
    headers: { 'content-type': 'application/json' },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ data: { __typename: expect.any(String) } });
  await ctx.dispose();
});

test('the removed Post and Product addresses are not served as content', async () => {
  const api = await request.newContext({ baseURL: BASE_URL });
  for (const path of ['/posts', '/posts/some-story', '/admin/posts', '/admin/news', '/admin/products']) {
    const response = await api.get(path, { maxRedirects: 0 });
    expect(response.status(), path).not.toBe(301);
    expect(response.headers()['location'], `${path} does not redirect`).toBeUndefined();
  }
  await api.dispose();
});

test('the News Atom feed lists published articles only, safely escaped', async () => {
  const operator = await Api.operator();
  const published = await createPublished(operator, 'Article', { title: `Feed & <friends> ${uniqueSlug()}` });
  const draft = await createOk(operator, 'Article', { title: `Feed draft ${uniqueSlug()}` });
  await operator.dispose();
  const api = await request.newContext({ baseURL: BASE_URL });
  const response = await api.get('/news/feed.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^application\/atom\+xml/);
  const body = await response.text();
  expect(body).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
  expect(body).toContain(published.title.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'));
  expect(body).toContain(`/news/${published.slug}`);
  expect(body).not.toContain(draft.title);
  await api.dispose();
  // The site advertises it from every page.
  const page = await request.newContext({ baseURL: BASE_URL });
  expect(await (await page.get('/')).text()).toContain('type="application/atom+xml"');
  await page.dispose();
});
