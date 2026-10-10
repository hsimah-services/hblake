import { expect, test } from '@playwright/test';

import { Api, expectRejected } from '../../lib/api.ts';
import {
  KINDS,
  UTC_TIMESTAMP,
  byId,
  bySlug,
  create,
  createOk,
  defaults,
  expectRecent,
  field,
  remove,
  sleep,
  update,
  updateOk,
  uniqueSlug,
} from '../../lib/content.ts';

// Shared Content and Timestamps behaviour for Page, Post and Product (acceptance 2).

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
      expect(result.data[`create${kind}`][field(kind)]).toMatchObject({ content: '', excerpt: '', status: 'DRAFT' });
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
      expect(result.data[`delete${kind}`].deletedId).toBe(row.id);
      expect(await byId(api, kind, row.id)).toBeNull();
      expect(await bySlug(api, kind, row.slug)).toBeNull();
    });
  });
}
