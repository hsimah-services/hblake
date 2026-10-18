import { expect, request, test } from '@playwright/test';

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

test('old /posts addresses redirect permanently to /news', async () => {
  const api = await request.newContext({ baseURL: BASE_URL });
  for (const [from, to] of [
    ['/posts', '/news'],
    ['/posts/some-story', '/news/some-story'],
    ['/admin/posts?after=abc', '/admin/news?after=abc'],
    ['/admin/posts/xyz/edit', '/admin/news/xyz/edit'],
  ]) {
    const response = await api.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(301);
    expect(response.headers()['location'], from).toBe(to);
  }
  await api.dispose();
});
