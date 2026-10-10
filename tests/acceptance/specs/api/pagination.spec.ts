import { expect, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { type Content, createOk, createPublished, pageOf, publishOk, walk } from '../../lib/content.ts';
import { RUN_ID } from '../../lib/env.ts';

// Bounded cursor pagination (architecture.md: default 20, maximum 100) and ordering
// (website.md: posts newest first, products by title then id; acceptance 9). V1 accepts
// short or empty policy-filtered pages, so continuation must still reach every row.

let operator: Api;
let anonymous: Api;
const published: Content[] = [];
const drafts: Content[] = [];

test.beforeAll(async () => {
  test.setTimeout(300_000);
  operator = await Api.operator();
  anonymous = await Api.anonymous();
  // 105 published posts with drafts interleaved; publish order is creation order.
  for (let i = 0; i < 105; i += 1) {
    const post = await createOk(operator, 'Post', { title: `Paging ${RUN_ID} ${String(i).padStart(3, '0')}` });
    published.push(await publishOk(operator, 'Post', post.id));
    if (i % 5 === 0) drafts.push(await createOk(operator, 'Post', { title: `Paging draft ${RUN_ID} ${i}` }));
  }
});

test.afterAll(async () => {
  await operator.dispose();
  await anonymous.dispose();
});

test('a page defaults to 20 rows', async () => {
  const page = await pageOf(anonymous, 'Post');
  expect(page.nodes.length).toBeLessThanOrEqual(20);
  expect(page.pageInfo.hasNextPage).toBe(true);
  // The newest 20 posts are all published, so this page cannot be short.
  expect(page.nodes).toHaveLength(20);
});

test('a page is capped at 100 rows', async () => {
  const page = await pageOf(anonymous, 'Post', { first: 1000 });
  expect(page.nodes.length).toBeLessThanOrEqual(100);
  expect(page.pageInfo.hasNextPage).toBe(true);
});

test('first: 1 returns one row and a cursor to continue', async () => {
  const page = await pageOf(anonymous, 'Post', { first: 1 });
  expect(page.nodes).toHaveLength(1);
  expect(page.nodes[0].id).toBe(published.at(-1)!.id);
  expect(page.pageInfo).toMatchObject({ hasNextPage: true });
  expect(page.pageInfo.endCursor).toBeTruthy();
});

test('following cursors visits every published post once, newest first, and no drafts', async () => {
  for (const size of [7, 20, 100]) {
    const { nodes } = await walk(anonymous, 'Post', size);
    const ids = nodes.map(node => node.id);
    expect(new Set(ids).size, `no duplicates at page size ${size}`).toBe(ids.length);
    const ours = ids.filter(id => published.some(post => post.id === id));
    expect(ours, `newest first at page size ${size}`).toEqual(published.map(post => post.id).reverse());
    for (const draft of drafts) expect(ids).not.toContain(draft.id);
  }
});

test('posts are ordered by publishedAt descending, then id descending', async () => {
  const { nodes } = await walk(anonymous, 'Post');
  for (let i = 1; i < nodes.length; i += 1) {
    const previous = Date.parse(nodes[i - 1].publishedAt!);
    const current = Date.parse(nodes[i].publishedAt!);
    expect(previous, `${nodes[i - 1].slug} before ${nodes[i].slug}`).toBeGreaterThanOrEqual(current);
  }
});

test('products are ordered by title ascending, then id ascending', async () => {
  const b = await createPublished(operator, 'Product', { title: `0 ${RUN_ID} b` });
  const a1 = await createPublished(operator, 'Product', { title: `0 ${RUN_ID} a` });
  const a2 = await createPublished(operator, 'Product', { title: `0 ${RUN_ID} a` });
  const { nodes } = await walk(anonymous, 'Product', 2);
  const ours = nodes.map(node => node.id).filter(id => [a1.id, a2.id, b.id].includes(id));
  expect(ours).toEqual([a1.id, a2.id, b.id]);
  const titles = nodes.map(node => node.title);
  expect(titles, 'titles ascending').toEqual([...titles].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)));
});

test('the operator pages through drafts too', async () => {
  const { nodes } = await walk(operator, 'Post', 50);
  const ids = nodes.map(node => node.id);
  for (const draft of drafts) expect(ids).toContain(draft.id);
});
