import { expect, test } from '@playwright/test';

import { Api, expectRejected } from '../../lib/api.ts';
import { OPERATOR } from '../../lib/env.ts';
import {
  KINDS,
  UTC_TIMESTAMP,
  byId,
  bySlug,
  create,
  createOk,
  defaults,
  expectRecent,
  HOSTS,
  field,
  hostPage,
  publishOk,
  remove,
  typeName,
  sleep,
  update,
  updateOk,
  uniqueSlug,
} from '../../lib/content.ts';

// Shared Content and Timestamps behaviour for Page and for PageItem (as Article and Product) (acceptance 2).

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
});

test.afterAll(async () => {
  await api.dispose();
});

for (const kind of KINDS) {
  test.describe(kind, () => {
    test('create stores the shared fields and starts as an unpublished draft', async () => {
      const input = defaults(kind, kind === 'Product' ? { enquiryUrl: 'https://example.com/enquire' } : {});
      const row = await createOk(api, kind, input);
      expect(row).toMatchObject({
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        status: 'DRAFT',
        publishedAt: null,
      });
      if (kind === 'Product') expect(row.enquiryUrl).toBe('https://example.com/enquire');
      expect(row.id).toBeTruthy();
      expectRecent(row.createdAt, 'createdAt');
      expectRecent(row.updatedAt, 'updatedAt');
    });

    test('content and excerpt default to empty strings on create', async () => {
      const slug = uniqueSlug(field(kind));
      const result = await create(api, kind, { title: `Minimal ${slug}`, slug });
      expect(result.errors).toEqual([]);
      expect(result.data[`create${typeName(kind)}`][field(kind)]).toMatchObject({ content: '', excerpt: '', status: 'DRAFT' });
    });

    test('update changes fields, advances updatedAt and keeps createdAt', async () => {
      const row = await createOk(api, kind);
      await sleep(1_100);
      const updated = await updateOk(api, kind, row.id, { title: `${row.title} (edited)`, excerpt: 'Edited excerpt.' });
      expect(updated).toMatchObject({ title: `${row.title} (edited)`, excerpt: 'Edited excerpt.', slug: row.slug });
      expect(updated.createdAt).toBe(row.createdAt);
      expect(updated.updatedAt).toMatch(UTC_TIMESTAMP);
      expect(Date.parse(updated.updatedAt)).toBeGreaterThan(Date.parse(row.updatedAt));
    });

    test('changing the title never changes the slug', async () => {
      const row = await createOk(api, kind);
      const updated = await updateOk(api, kind, row.id, { title: 'A completely different title' });
      expect(updated.slug).toBe(row.slug);
    });

    test('clients cannot supply managed timestamps on create', async () => {
      const input = defaults(kind, { createdAt: '2000-01-01T00:00:00+00:00', updatedAt: '2000-01-01T00:00:00+00:00' });
      expectRejected(await create(api, kind, input), 'createdAt/updatedAt are not create inputs');
      expect(await bySlug(api, kind, input.slug as string), 'nothing was created').toBeNull();
    });

    test('clients cannot supply managed timestamps on update', async () => {
      const row = await createOk(api, kind);
      expectRejected(await update(api, kind, row.id, { updatedAt: '2000-01-01T00:00:00+00:00' }));
      expectRejected(await update(api, kind, row.id, { createdAt: '2000-01-01T00:00:00+00:00' }));
      const after = await byId(api, kind, row.id);
      expect(after?.createdAt).toBe(row.createdAt);
      expect(after?.updatedAt).toBe(row.updatedAt);
    });

    test('delete removes the record and reports its id', async () => {
      const row = await createOk(api, kind);
      const result = await remove(api, kind, row.id);
      expect(result.errors).toEqual([]);
      expect(result.data[`delete${typeName(kind)}`].deletedId).toBe(row.id);
      expect(await byId(api, kind, row.id)).toBeNull();
      expect(await bySlug(api, kind, row.slug)).toBeNull();
    });
  });
}

test.describe('authorship', () => {
  for (const kind of KINDS) {
    test(`${kind}: the signed-in author is recorded by the server`, async () => {
      const row = await createOk(api, kind);
      expect(row.author, `${kind}.author`).toEqual({ displayName: OPERATOR.displayName });
      const updated = await updateOk(api, kind, row.id, { title: `${row.title} again` });
      expect(updated.author, 'editing keeps the author').toEqual({ displayName: OPERATOR.displayName });
    });

    test(`${kind}: clients cannot choose the author`, async () => {
      const viewer = (await api.viewer())!;
      for (const author of [viewer.id, 'someone-else', { displayName: 'Somebody' }]) {
        const input = defaults(kind, { author } as Record<string, unknown>);
        expectRejected(await create(api, kind, input), `author ${JSON.stringify(author)} is not an input`);
        expect(await bySlug(api, kind, input.slug as string), 'nothing was created').toBeNull();
      }
    });
  }
});

test.describe('items belong to a page', () => {
  test('an item is attached to its page and labelled with a kind', async () => {
    const host = await hostPage('Article');
    const row = await createOk(api, 'Article');
    expect(row.page).toEqual({ id: host.id, slug: HOSTS.Article.slug });
    expect(row.kind).toBe('Article');
    const product = await createOk(api, 'Product');
    expect(product.page?.slug).toBe(HOSTS.Product.slug);
    expect(product.kind).toBe('Product');
  });

  test('a page chooses the kind of item it holds, and new items default to it', async () => {
    const host = await hostPage('Article');
    const page = (await api.ok('query($id: ID!) { page(id: $id) { defaultItemKind } }', { id: host.id })).page;
    expect(page.defaultItemKind).toBe('Article');
    const slug = uniqueSlug('default-kind');
    const result = await api.graphql(
      'mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { kind } } }',
      { input: { page: host.id, title: `Default kind ${slug}`, slug } },
    );
    expect(result.errors).toEqual([]);
    expect(result.data.createPageItem.pageItem.kind).toBe('Article');
  });

  test('one page can hold items of several kinds', async () => {
    const host = await hostPage('Article');
    const row = await createOk(api, 'Article', { kind: 'Framework' });
    expect(row.kind).toBe('Framework');
    expect(row.page?.id).toBe(host.id);
  });

  test('an item needs an existing page that holds items', async () => {
    const plain = await createOk(api, 'Page');
    const attempts: [string, Record<string, unknown>][] = [
      ['a page that holds no items', { page: plain.id }],
      ['a missing page id', { page: 'no-such-page' }],
      ['an item id as the page', { page: (await createOk(api, 'Product')).id }],
      ['a blank kind', { kind: '  ' }],
      ['a kind over 80 characters', { kind: 'k'.repeat(81) }],
    ];
    for (const [label, extra] of attempts) {
      const input = defaults('Article', extra);
      expectRejected(await create(api, 'Article', input), label);
      expect(await bySlug(api, 'Article', input.slug as string), `${label}: nothing stored`).toBeNull();
    }
    const result = await api.graphql(
      'mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id } } }',
      { input: { title: 'No page', slug: uniqueSlug('no-page') } },
    );
    expectRejected(result, 'an item without a page');
  });

  test('item slugs are unique across every item, whatever its page', async () => {
    const article = await createOk(api, 'Article');
    expectRejected(await create(api, 'Product', defaults('Product', { slug: article.slug })), 'same slug on another page');
  });

  test('deleting a page deletes its items', async () => {
    const slug = uniqueSlug('doomed');
    const page = await createOk(api, 'Page', { slug, defaultItemKind: 'Note' });
    const result = await api.graphql(
      'mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id } } }',
      { input: { page: page.id, title: 'Goes with its page', slug: uniqueSlug('goes') } },
    );
    expect(result.errors).toEqual([]);
    const itemId = result.data.createPageItem.pageItem.id as string;
    expect((await remove(api, 'Page', page.id)).errors).toEqual([]);
    expect(await byId(api, 'Article', itemId), 'the item went with its page').toBeNull();
  });

  test('a published item is visible only while its page is published', async () => {
    const slug = uniqueSlug('draft-host');
    const page = await createOk(api, 'Page', { slug, defaultItemKind: 'Note' });
    const created = await api.graphql(
      'mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id slug } } }',
      { input: { page: page.id, title: 'On a draft page', slug: uniqueSlug('on-draft'), content: 'Body.' } },
    );
    const item = created.data.createPageItem.pageItem as { id: string; slug: string };
    const anonymous = await Api.anonymous();
    await publishOk(api, 'Article', item.id);
    expect(await bySlug(anonymous, 'Article', item.slug), 'invisible while its page is a draft').toBeNull();
    await publishOk(api, 'Page', page.id);
    expect((await bySlug(anonymous, 'Article', item.slug))?.id).toBe(item.id);
    await anonymous.dispose();
  });

  test('a page counts its items: all of them for staff, only published ones for visitors', async () => {
    const page = await createOk(api, 'Page', { slug: uniqueSlug('counted'), defaultItemKind: 'Note' });
    await publishOk(api, 'Page', page.id);
    const ids: string[] = [];
    for (const label of ['one', 'two']) {
      const created = await api.graphql(
        'mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id } } }',
        { input: { page: page.id, title: `Counted ${label}`, slug: uniqueSlug(label), content: 'Body.' } },
      );
      ids.push(created.data.createPageItem.pageItem.id as string);
    }
    await publishOk(api, 'Article', ids[0]);
    const counts = 'query($id: ID!) { page(id: $id) { itemCount publishedItemCount } }';
    expect((await api.ok(counts, { id: page.id })).page).toEqual({ itemCount: 2, publishedItemCount: 1 });
    const anonymous = await Api.anonymous();
    expect((await anonymous.ok(counts, { id: page.id })).page, 'drafts are not counted for visitors').toEqual({ itemCount: 1, publishedItemCount: 1 });
    await anonymous.dispose();
  });
});
