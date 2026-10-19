import { expect, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { type Content, createOk, createPublished, pageOf, publishOk, walk } from '../../lib/content.ts';
import { RUN_ID } from '../../lib/env.ts';

// Bounded cursor pagination (architecture.md: default 20, maximum 100) and ordering
// (website.md: items newest published first; acceptance 9). V1 accepts
// short or empty policy-filtered pages, so continuation must still reach every row.

let operator: Api;
let anonymous: Api;
const published: Content[] = [];
const drafts: Content[] = [];

test.beforeAll(async () => {
  test.setTimeout(300_000);
  operator = await Api.operator();
  anonymous = await Api.anonymous();
  // 105 published articles with drafts interleaved; publish order is creation order.
  for (let i = 0; i < 105; i += 1) {
    const item = await createOk(operator, 'Article', { title: `Paging ${RUN_ID} ${String(i).padStart(3, '0')}` });
    published.push(await publishOk(operator, 'Article', item.id));
    if (i % 5 === 0) drafts.push(await createOk(operator, 'Article', { title: `Paging draft ${RUN_ID} ${i}` }));
  }
});

test.afterAll(async () => {
  await operator.dispose();
  await anonymous.dispose();
});

test('a page defaults to 20 rows', async () => {
  const page = await pageOf(anonymous, 'Article');
  expect(page.nodes.length).toBeLessThanOrEqual(20);
  expect(page.pageInfo.hasNextPage).toBe(true);
  // The newest 20 articles are all published, so this page cannot be short.
  expect(page.nodes).toHaveLength(20);
});

test('a page is capped at 100 rows', async () => {
  const page = await pageOf(anonymous, 'Article', { first: 1000 });
  expect(page.nodes.length).toBeLessThanOrEqual(100);
  expect(page.pageInfo.hasNextPage).toBe(true);
});

test('first: 1 returns one row and a cursor to continue', async () => {
  const page = await pageOf(anonymous, 'Article', { first: 1 });
  expect(page.nodes).toHaveLength(1);
  expect(page.nodes[0].id).toBe(published.at(-1)!.id);
  expect(page.pageInfo).toMatchObject({ hasNextPage: true });
  expect(page.pageInfo.endCursor).toBeTruthy();
});

test('following cursors visits every published article once, newest first, and no drafts', async () => {
  for (const size of [7, 20, 100]) {
    const { nodes } = await walk(anonymous, 'Article', size);
    const ids = nodes.map(node => node.id);
    expect(new Set(ids).size, `no duplicates at page size ${size}`).toBe(ids.length);
    const ours = ids.filter(id => published.some(row => row.id === id));
    expect(ours, `newest first at page size ${size}`).toEqual(published.map(row => row.id).reverse());
    for (const draft of drafts) expect(ids).not.toContain(draft.id);
  }
});

test('articles are ordered by publishedAt descending, then id descending', async () => {
  const { nodes } = await walk(anonymous, 'Article');
  for (let i = 1; i < nodes.length; i += 1) {
    const previous = Date.parse(nodes[i - 1].publishedAt!);
    const current = Date.parse(nodes[i].publishedAt!);
    expect(previous, `${nodes[i - 1].slug} before ${nodes[i].slug}`).toBeGreaterThanOrEqual(current);
  }
});

test('items are read per page: products never appear among articles', async () => {
  const product = await createPublished(operator, 'Product', { title: `Paging product ${RUN_ID}` });
  const { nodes } = await walk(anonymous, 'Article');
  expect(nodes.map(node => node.id)).not.toContain(product.id);
  expect(nodes.every(node => node.page?.slug === 'news' && node.kind === 'Article')).toBe(true);
  expect((await walk(anonymous, 'Product')).nodes.map(node => node.id)).toContain(product.id);
});

test('an unknown page lists no items', async () => {
  const result = await anonymous.graphql('{ pageItemsOfPage(where: { page: "no-such-page" }, first: 5) { totalCount nodes { id } } }');
  expect(result.errors).toEqual([]);
  expect(result.data?.pageItemsOfPage).toEqual({ totalCount: 0, nodes: [] });
});

test('the operator pages through drafts too', async () => {
  const { nodes } = await walk(operator, 'Article', 50);
  const ids = nodes.map(node => node.id);
  for (const draft of drafts) expect(ids).toContain(draft.id);
});
