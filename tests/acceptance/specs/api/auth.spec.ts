import { expect, test } from '@playwright/test';

import { Api, expectRejected, setCookies } from '../../lib/api.ts';
import { bySlug, create, defaults } from '../../lib/content.ts';
import { BASE_URL, OPERATOR } from '../../lib/env.ts';

// Session authentication over HTTP (architecture.md, acceptance 8). The endpoint
// contract is in tests/README.md. This file makes exactly two failed login attempts;
// the rate limit must tolerate at least five (tests/ops covers the limit itself).

test('a successful login returns the viewer and sets a hardened session cookie', async () => {
  const api = await Api.anonymous();
  const response = await api.login(OPERATOR.username, OPERATOR.password);
  expect(response.status()).toBe(200);
  expect((await response.json()).viewer).toMatchObject({ displayName: OPERATOR.displayName, role: 'ADMIN' });
  expect(response.headers()['cache-control'] ?? '').toMatch(/no-store/);

  const session = setCookies(response).filter(cookie => cookie.attributes.has('httponly'));
  expect(session.length, 'login sets at least one HttpOnly cookie').toBeGreaterThan(0);
  for (const cookie of session) {
    expect(cookie.attributes.get('samesite') ?? '', `${cookie.name} SameSite`).toMatch(/^(lax|strict)$/i);
    expect(cookie.attributes.get('path'), `${cookie.name} Path`).toBe('/');
    if (BASE_URL.startsWith('https:')) expect(cookie.attributes.has('secure'), `${cookie.name} Secure`).toBe(true);
  }
  expect(await api.viewer()).toMatchObject({ role: 'ADMIN' });
  await api.dispose();
});

test('failed logins are generic and do not reveal whether the account exists', async () => {
  const api = await Api.anonymous();
  const wrongPassword = await api.login(OPERATOR.username, `${OPERATOR.password}-wrong`);
  const unknownAccount = await api.login(`nobody-${Date.now()}`, OPERATOR.password);
  expect(wrongPassword.status()).toBe(401);
  expect(unknownAccount.status()).toBe(401);
  expect(await wrongPassword.text()).toBe(await unknownAccount.text());
  expect(await api.viewer()).toBeNull();
  await api.dispose();
});

test('login requires the CSRF token', async () => {
  const api = await Api.anonymous();
  const response = await api.login(OPERATOR.username, OPERATOR.password, { csrf: false });
  expect(response.status()).toBe(403);
  expect(await api.viewer()).toBeNull();
  await api.dispose();
});

test('mutations require the CSRF token and apply nothing without it', async () => {
  const api = await Api.operator();
  for (const csrf of [false, 'not-the-token'] as const) {
    const input = defaults('Page');
    const refused = await api.graphql(
      'mutation Create($input: CreatePageInput!) { createPage(input: $input) { page { id } } }',
      { input },
      { csrf },
    );
    expect(refused.status, `CSRF ${csrf === false ? 'missing' : 'wrong'}`).toBe(403);
    expect(await bySlug(api, 'Page', input.slug as string)).toBeNull();
  }
  await api.dispose();
});

test('queries do not need a CSRF token', async () => {
  const api = await Api.anonymous();
  const result = await api.graphql('query { pageItems(first: 1) { totalCount } }');
  expect(result.status).toBe(200);
  expect(result.errors).toEqual([]);
  await api.dispose();
});

test('login rotates the session; pre-login cookies are not authenticated', async () => {
  const api = await Api.anonymous();
  await api.csrfToken(true);
  const before = await api.storageState();
  const response = await api.login(OPERATOR.username, OPERATOR.password);
  expect(response.status()).toBe(200);
  const after = await api.storageState();

  for (const cookie of before.cookies.filter(c => c.httpOnly)) {
    const rotated = after.cookies.find(c => c.name === cookie.name);
    if (rotated) expect(rotated.value, `${cookie.name} is rotated on login`).not.toBe(cookie.value);
  }

  const replay = await Api.anonymous(before);
  expect(await replay.viewer(), 'the pre-login session is not signed in').toBeNull();
  await replay.dispose();
  await api.dispose();
});

test('logout revokes the session server-side', async () => {
  const api = await Api.operator();
  const signedIn = await api.storageState();
  const response = await api.logout();
  expect(response.status()).toBeLessThan(300);
  expect(await api.viewer()).toBeNull();

  const replay = await Api.anonymous(signedIn);
  expect(await replay.viewer(), 'a copied session cookie stops working after logout').toBeNull();
  const input = defaults('Page');
  expectRejected(await create(replay, 'Page', input), 'mutation with a revoked session');
  await replay.dispose();

  const check = await Api.operator();
  expect(await bySlug(check, 'Page', input.slug as string)).toBeNull();
  await check.dispose();
  await api.dispose();
});

test('logout requires the CSRF token', async () => {
  const api = await Api.operator();
  const response = await api.logout({ csrf: false });
  expect(response.status()).toBe(403);
  expect(await api.viewer()).toMatchObject({ role: 'ADMIN' });
  await api.dispose();
});

test('authenticated responses are never cacheable by shared caches', async () => {
  const api = await Api.operator();
  const result = await api.graphql('query { viewer { id } pages(first: 1) { nodes { id status } } }');
  expect(result.headers['cache-control'] ?? '', 'POST /graphql with a session').toMatch(/no-store|private/);
  const csrf = await api.ctx.get('/auth/csrf');
  expect(csrf.headers()['cache-control'] ?? '', 'GET /auth/csrf').toMatch(/no-store/);
  await api.dispose();
});

test.describe('sessions are created only when needed', () => {
  test('anonymous reads do not create a session', async () => {
    // Crawlers and first-time visitors must not each leave a session row behind.
    const api = await Api.anonymous();
    const query = await api.ctx.post('/graphql', { data: { query: '{ pageItems(first: 1) { totalCount } }' } });
    expect(query.status()).toBe(200);
    expect(setCookies(query).map(cookie => cookie.name), 'Set-Cookie on an anonymous GraphQL query').toEqual([]);
    for (const path of ['/', '/pages/news', '/admin/login']) {
      const response = await api.ctx.get(path);
      expect(setCookies(response).map(cookie => cookie.name), `Set-Cookie on GET ${path}`).toEqual([]);
    }
    await api.dispose();
  });

  test('a cookieless mutation is refused without creating a session', async () => {
    const api = await Api.anonymous();
    const input = defaults('Article');
    const response = await api.ctx.post('/graphql', {
      data: { query: 'mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id } } }', variables: { input } },
      headers: { 'X-CSRF-Token': 'not-a-token' },
    });
    expect(response.status()).toBe(403);
    expect(setCookies(response).map(cookie => cookie.name)).toEqual([]);
    await api.dispose();
  });
});

test.describe('session cookies are Secure outside loopback HTTP', () => {
  // tests/README.md: cookies omit Secure only for plain-HTTP requests to a loopback host,
  // so a deployment behind a TLS proxy is safe without extra configuration. The Host
  // header stands in for a public hostname that reached the app over a proxy.
  const PUBLIC_HOST = { Host: 'www.example.test' };

  test('the anonymous CSRF session cookie is Secure for a public host', async () => {
    const api = await Api.anonymous();
    const response = await api.ctx.get('/auth/csrf', { headers: PUBLIC_HOST });
    expect(response.status()).toBe(200);
    const cookies = setCookies(response);
    expect(cookies.length, 'GET /auth/csrf starts a session').toBeGreaterThan(0);
    for (const cookie of cookies) expect(cookie.attributes.has('secure'), `${cookie.name} Secure`).toBe(true);
    await api.dispose();
  });

  test('the signed-in session cookie is Secure for a public host', async () => {
    const api = await Api.anonymous();
    const token = await api.csrfToken();
    const response = await api.ctx.post('/auth/login', {
      data: { username: OPERATOR.username, password: OPERATOR.password },
      headers: { ...PUBLIC_HOST, 'X-CSRF-Token': token },
    });
    expect(response.status(), await response.text()).toBe(200);
    const session = setCookies(response).filter(cookie => cookie.attributes.has('httponly'));
    expect(session.length).toBeGreaterThan(0);
    for (const cookie of session) expect(cookie.attributes.has('secure'), `${cookie.name} Secure`).toBe(true);
    await api.dispose();
  });
});
