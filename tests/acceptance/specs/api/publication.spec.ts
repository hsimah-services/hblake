import { expect, test } from '@playwright/test';

import { Api, expectRejected } from '../../lib/api.ts';
import {
  KINDS,
  action,
  byId,
  bySlug,
  create,
  createOk,
  defaults,
  expectRecent,
  publishOk,
  sleep,
  unpublishOk,
  update,
  updateOk,
} from '../../lib/content.ts';

// Publishable: website.md "publish sets status and first publishedAt together…" and
// acceptance 3. status/publishedAt still appear in generated inputs until
// elephentity#103, so the verifiers must reject direct changes.

let operator: Api;
let anonymous: Api;

test.beforeAll(async () => {
  operator = await Api.operator();
  anonymous = await Api.anonymous();
});

test.afterAll(async () => {
  await operator.dispose();
  await anonymous.dispose();
});

for (const kind of KINDS) {
  test.describe(kind, () => {
    test('publish sets status and a server-clock publishedAt together', async () => {
      const row = await createOk(operator, kind);
      expect(await bySlug(anonymous, kind, row.slug), 'drafts are not public').toBeNull();
      const published = await publishOk(operator, kind, row.id);
      expect(published.status).toBe('PUBLISHED');
      expectRecent(published.publishedAt, 'publishedAt');
      expect(await bySlug(anonymous, kind, row.slug)).toMatchObject({ id: row.id, status: 'PUBLISHED' });
    });

    test('publishing again keeps the first publication time', async () => {
      const first = await publishOk(operator, kind, (await createOk(operator, kind)).id);
      await sleep(1_100);
      const again = await action(operator, kind, 'publish', first.id);
      // Either outcome is acceptable for a repeat publish; the timestamp must not move.
      if (again.errors.length === 0) expect(again.data[`publish${kind}`]).toBeTruthy();
      const after = await byId(operator, kind, first.id);
      expect(after).toMatchObject({ status: 'PUBLISHED', publishedAt: first.publishedAt });
    });

    test('unpublish hides the record immediately and keeps publishedAt', async () => {
      const published = await publishOk(operator, kind, (await createOk(operator, kind)).id);
      expect(await bySlug(anonymous, kind, published.slug)).not.toBeNull();
      const unpublished = await unpublishOk(operator, kind, published.id);
      expect(unpublished).toMatchObject({ status: 'DRAFT', publishedAt: published.publishedAt });
      expect(await bySlug(anonymous, kind, published.slug)).toBeNull();
    });

    test('republishing keeps the original publication time', async () => {
      const published = await publishOk(operator, kind, (await createOk(operator, kind)).id);
      await unpublishOk(operator, kind, published.id);
      await sleep(1_100);
      const republished = await publishOk(operator, kind, published.id);
      expect(republished).toMatchObject({ status: 'PUBLISHED', publishedAt: published.publishedAt });
    });

    test('create cannot start published', async () => {
      const input = defaults(kind, { status: 'PUBLISHED' });
      expectRejected(await create(operator, kind, input), 'create requires draft status');
      expect(await bySlug(operator, kind, input.slug as string)).toBeNull();
    });

    test('create cannot set publishedAt', async () => {
      const input = defaults(kind, { publishedAt: '2020-01-01T00:00:00+00:00' });
      expectRejected(await create(operator, kind, input), 'create requires null publishedAt');
      expect(await bySlug(operator, kind, input.slug as string)).toBeNull();
    });

    test('update cannot publish by setting status', async () => {
      const row = await createOk(operator, kind);
      expectRejected(await update(operator, kind, row.id, { status: 'PUBLISHED' }));
      expect(await byId(operator, kind, row.id)).toMatchObject({ status: 'DRAFT', publishedAt: null });
      expect(await bySlug(anonymous, kind, row.slug)).toBeNull();
    });

    test('update cannot unpublish by setting status', async () => {
      const published = await publishOk(operator, kind, (await createOk(operator, kind)).id);
      expectRejected(await update(operator, kind, published.id, { status: 'DRAFT' }));
      expect(await byId(operator, kind, published.id)).toMatchObject({ status: 'PUBLISHED' });
    });

    test('update cannot set or clear publishedAt', async () => {
      const draft = await createOk(operator, kind);
      expectRejected(await update(operator, kind, draft.id, { publishedAt: '2020-01-01T00:00:00+00:00' }));
      expect((await byId(operator, kind, draft.id))?.publishedAt).toBeNull();

      const published = await publishOk(operator, kind, (await createOk(operator, kind)).id);
      expectRejected(await update(operator, kind, published.id, { publishedAt: null }));
      expectRejected(await update(operator, kind, published.id, { publishedAt: '2020-01-01T00:00:00+00:00' }));
      expect((await byId(operator, kind, published.id))?.publishedAt).toBe(published.publishedAt);
    });

    test('an ordinary save may resend the unchanged status', async () => {
      const row = await createOk(operator, kind);
      const saved = await updateOk(operator, kind, row.id, { title: `${row.title}!`, status: 'DRAFT' });
      expect(saved).toMatchObject({ title: `${row.title}!`, status: 'DRAFT' });
    });

    test('publishing requires a nonblank body', async () => {
      const row = await createOk(operator, kind, { content: '   \n  ' });
      expectRejected(await action(operator, kind, 'publish', row.id), 'publish with a blank body');
      expect(await byId(operator, kind, row.id)).toMatchObject({ status: 'DRAFT', publishedAt: null });
    });

    test('a published record cannot have its body blanked', async () => {
      const published = await publishOk(operator, kind, (await createOk(operator, kind)).id);
      expectRejected(await update(operator, kind, published.id, { content: '' }));
      expect((await byId(operator, kind, published.id))?.content).toBe(published.content);
    });

    test('drafts may have an empty body', async () => {
      const row = await createOk(operator, kind, { content: '' });
      expect(row.content).toBe('');
    });
  });
}
