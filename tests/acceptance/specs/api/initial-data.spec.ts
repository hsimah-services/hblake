import { expect, test, type APIResponse } from '@playwright/test';

import { Api, setCookies } from '../../lib/api.ts';
import { createOk, createPublished, publicPath, uniqueSlug } from '../../lib/content.ts';
import { OPERATOR } from '../../lib/env.ts';

// Initial data (architecture.md § Frontend, tests/README.md § HTML contract): the HTML
// for a route carries that route's query response, executed as the requesting viewer,
// in <script type="application/json" id="tsquid-data">.

interface InitialData {
  version: number;
  responses: { operation: string; variables: Record<string, unknown>; response: { data?: unknown; errors?: unknown[] } }[];
}

const PAYLOAD = /<script type="application\/json" id="tsquid-data">([\s\S]*?)<\/script>/;

async function html(api: Api, path: string): Promise<{ response: APIResponse; body: string; payload: InitialData | null }> {
  const response = await api.ctx.get(path);
  expect(response.status(), `GET ${path}`).toBe(200);
  expect(response.headers()['content-type'] ?? '', `GET ${path} content type`).toMatch(/^text\/html/);
  const body = await response.text();
  const match = body.match(PAYLOAD);
  let payload: InitialData | null = null;
  if (match) {
    expect(() => (payload = JSON.parse(match[1])), `#tsquid-data on ${path} is JSON`).not.toThrow();
  }
  return { response, body, payload };
}

let visitor: Api;
let operator: Api;

test.beforeAll(async () => {
  visitor = await Api.anonymous();
  operator = await Api.operator();
});

test.afterAll(async () => {
  await visitor.dispose();
  await operator.dispose();
});

test('a public route inlines its query response and is not shared-cacheable', async () => {
  const post = await createPublished(operator, 'Post');
  const { response, payload } = await html(visitor, publicPath('Post', post.slug));
  expect(payload, 'the route HTML carries #tsquid-data').not.toBeNull();
  expect(payload!.version).toBe(1);
  expect(payload!.responses, 'exactly the route query').toHaveLength(1);
  const [entry] = payload!.responses;
  expect(entry.variables).toEqual({ slug: post.slug });
  expect(JSON.stringify(entry.response.data)).toContain(post.title);
  expect(response.headers()['cache-control'] ?? '').toMatch(/private|no-store/);
  expect(setCookies(response).map(cookie => cookie.name), 'no session for an anonymous page view').toEqual([]);
});

test('list routes bind their URL cursor', async () => {
  for (const path of ['/posts', '/products']) {
    const { payload } = await html(visitor, path);
    expect(payload?.responses, `${path} inlines its list query`).toHaveLength(1);
    expect(payload!.responses[0].variables.after ?? null).toBeNull();
  }
});

test('drafts are inlined only for staff', async () => {
  const draft = await createOk(operator, 'Post', { title: `Draft ${uniqueSlug('secret')}` });
  const path = publicPath('Post', draft.slug);
  const anonymous = await html(visitor, path);
  expect(anonymous.body, 'a visitor never receives draft text').not.toContain(draft.title);
  expect(anonymous.body).not.toContain(draft.content);
  const staff = await html(operator, path);
  expect(JSON.stringify(staff.payload?.responses[0]?.response.data ?? null), 'the operator previews their draft').toContain(draft.title);
});

test('private profile data is inlined only for the operator', async () => {
  const viewer = await operator.viewer();
  const path = `/admin/users/${encodeURIComponent(viewer!.id)}`;
  expect((await html(visitor, path)).body, 'a visitor never receives the operator username').not.toContain(OPERATOR.username);
  const signedIn = await html(operator, path);
  expect(JSON.stringify(signedIn.payload?.responses[0]?.response.data ?? null)).toContain(OPERATOR.username);
  expect(signedIn.response.headers()['cache-control'] ?? '').toMatch(/private|no-store/);
});

test('inlined content cannot break out of its script element', async () => {
  const hostile = '</script><script>window.__xss=1</script><!--';
  const post = await createPublished(operator, 'Post', { title: `T ${hostile}`, excerpt: hostile, content: `${hostile}\n\n</SCRIPT >` });
  const { body, payload } = await html(visitor, publicPath('Post', post.slug));
  expect(payload, 'the payload parses up to its own closing tag').not.toBeNull();
  expect(JSON.stringify(payload)).toContain(hostile);
  expect(body).not.toContain('<script>window.__xss');
});

test('URLs that match no route get the plain shell', async () => {
  for (const path of [`/nothing-${uniqueSlug()}`, '/posts/a/b/c', '/posts/%E0%A4%A']) {
    const { payload } = await html(visitor, path);
    expect(payload, path).toBeNull();
  }
});
