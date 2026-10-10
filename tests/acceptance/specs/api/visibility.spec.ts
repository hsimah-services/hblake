import { expect, test } from '@playwright/test';

import { Api, expectRejected } from '../../lib/api.ts';
import {
  KINDS,
  type Content,
  action,
  byId,
  byIdRaw,
  bySlugRaw,
  create,
  createOk,
  createPublished,
  defaults,
  field,
  remove,
  update,
  walk,
} from '../../lib/content.ts';
import { OPERATOR } from '../../lib/env.ts';

// Read and write policies (acceptance 4 and 5): anonymous viewers see published rows
// only, through every path; only a signed-in operator may write.

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
    let draft: Content;
    let published: Content;

    test.beforeAll(async () => {
      draft = await createOk(operator, kind, { title: `Secret draft ${Date.now()}` });
      published = await createPublished(operator, kind);
    });

    test('anonymous collections and counts exclude drafts', async () => {
      const { nodes, totalCount, bodies } = await walk(anonymous, kind);
      const ids = nodes.map(node => node.id);
      expect(ids).toContain(published.id);
      expect(ids).not.toContain(draft.id);
      expect(nodes.every(node => node.status === 'PUBLISHED')).toBe(true);
      expect(totalCount, 'totalCount counts only visible rows').toBe(nodes.length);
      for (const body of bodies) expect(body).not.toContain(draft.title);
    });

    test('anonymous by-slug, by-id and node lookups do not reveal drafts', async () => {
      const lookups = [
        await bySlugRaw(anonymous, kind, draft.slug),
        await byIdRaw(anonymous, kind, draft.id),
        await anonymous.graphql(`query Node($id: ID!) { node(id: $id) { id ... on ${kind} { title } } }`, { id: draft.id }),
      ];
      for (const result of lookups) {
        expect(result.body).not.toContain(draft.title);
        expect(JSON.stringify(result.data ?? {})).not.toContain(draft.id);
      }
    });

    test('anonymous lookups return published rows', async () => {
      expect((await bySlugRaw(anonymous, kind, published.slug)).data?.[`${field(kind)}BySlug`]?.id).toBe(published.id);
      expect((await byIdRaw(anonymous, kind, published.id)).data?.[field(kind)]?.id).toBe(published.id);
      const node = await anonymous.graphql(`query Node($id: ID!) { node(id: $id) { id ... on ${kind} { title } } }`, {
        id: published.id,
      });
      expect(node.data?.node).toMatchObject({ id: published.id, title: published.title });
    });

    test('the operator sees drafts in collections', async () => {
      const { nodes, totalCount } = await walk(operator, kind);
      expect(nodes.map(node => node.id)).toEqual(expect.arrayContaining([draft.id, published.id]));
      expect(totalCount).toBe(nodes.length);
    });

    test('anonymous visitors cannot create, update, publish, unpublish or delete', async () => {
      const input = defaults(kind);
      expectRejected(await create(anonymous, kind, input), 'anonymous create');
      expect((await bySlugRaw(operator, kind, input.slug as string)).data?.[`${field(kind)}BySlug`] ?? null).toBeNull();

      expectRejected(await update(anonymous, kind, draft.id, { title: 'Vandalised' }), 'anonymous update');
      expectRejected(await action(anonymous, kind, 'publish', draft.id), 'anonymous publish');
      expectRejected(await action(anonymous, kind, 'unpublish', published.id), 'anonymous unpublish');
      expectRejected(await remove(anonymous, kind, published.id), 'anonymous delete');

      expect(await byId(operator, kind, draft.id)).toMatchObject({ title: draft.title, status: 'DRAFT' });
      expect(await byId(operator, kind, published.id)).toMatchObject({ status: 'PUBLISHED' });
    });

    test('public content never exposes account details', async () => {
      const result = await bySlugRaw(anonymous, kind, published.slug);
      expect(result.body).not.toContain(OPERATOR.email);
    });
  });
}

test('ids of one kind never resolve as another kind', async () => {
  const post = await createPublished(operator, 'Post', { title: `Cross-type ${Date.now()}` });
  for (const api of [anonymous, operator]) {
    for (const kind of ['Page', 'Product'] as const) {
      const result = await byIdRaw(api, kind, post.id);
      expect(result.data?.[field(kind)] ?? null, `${field(kind)}(id: <Post id>)`).toBeNull();
      expect(result.body).not.toContain(post.title);
    }
  }
  const wrongUpdate = await update(operator, 'Page', post.id, { title: 'Hijacked' });
  expectRejected(wrongUpdate, 'updatePage with a Post id');
  expect((await byId(operator, 'Post', post.id))?.title).toBe(post.title);
});

test('the operator profile is not readable anonymously', async () => {
  const viewerId = (await operator.viewer())!.id;
  const result = await anonymous.graphql('query Profile($id: ID!) { adminUser(id: $id) { id email displayName } }', {
    id: viewerId,
  });
  expect(result.data?.adminUser ?? null).toBeNull();
  expect(result.body).not.toContain(OPERATOR.email);
  expect(await anonymous.viewer()).toBeNull();
});
