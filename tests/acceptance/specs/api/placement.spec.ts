import { expect, test } from '@playwright/test';

import { Api, expectRejected } from '../../lib/api.ts';
import { create, createOk, createPublished, defaults, update } from '../../lib/content.ts';

// Page placement (issue #13, Page.md): pages choose whether they show in the navigation
// and on the home page, in what order and in which colour.

const PLACEMENT = 'showInNavigation navigationOrder featureOnHome homeOrder accent';

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
});

test.afterAll(async () => {
  await api.dispose();
});

async function read(id: string) {
  return (await api.ok(`query($id: ID!) { page(id: $id) { ${PLACEMENT} } }`, { id })).page;
}

test('a new page shows in the navigation, after the launch pages, and is not a home tile', async () => {
  const created = await create(api, 'Page', defaults('Page'));
  expect(created.errors).toEqual([]);
  expect(await read(created.data.createPage.page.id)).toEqual({ showInNavigation: true, navigationOrder: 100, featureOnHome: false, homeOrder: 100, accent: 'INK' });
});

test('a page featured on the home page needs a colour', async () => {
  expectRejected(await create(api, 'Page', defaults('Page', { featureOnHome: true })), 'featured with no colour');
  const created = await create(api, 'Page', defaults('Page', { featureOnHome: true, accent: 'BLUE' }));
  expect(created.errors).toEqual([]);
  const id = created.data.createPage.page.id;
  expectRejected(await update(api, 'Page', id, { accent: 'INK' }), 'removing the colour of a featured page');
  expect((await read(id)).accent).toBe('BLUE');
});

test('orders are whole numbers from 0 to 999', async () => {
  for (const order of [-1, 1000]) {
    expectRejected(await create(api, 'Page', defaults('Page', { navigationOrder: order })), `navigation order ${order}`);
    expectRejected(await create(api, 'Page', defaults('Page', { homeOrder: order })), `home order ${order}`);
  }
});

test('placedPages lists published pages for the home page or the navigation, in order', async () => {
  const anonymous = await Api.anonymous();
  try {
    const later = await createPublished(api, 'Page', { featureOnHome: true, homeOrder: 2, accent: 'GREEN', showInNavigation: false });
    const first = await createPublished(api, 'Page', { featureOnHome: true, homeOrder: 1, accent: 'BLUE', showInNavigation: false });
    const draft = await createOk(api, 'Page', { featureOnHome: true, homeOrder: 0, accent: 'BLUE' });
    const slugs = async (home: boolean) => ((await anonymous.ok(`query($home: Boolean!) { placedPages(where: { home: $home }, first: 100) { nodes { slug } } }`, { home })).placedPages.nodes as { slug: string }[]).map(node => node.slug);
    const home = await slugs(true);
    expect(home.indexOf(first.slug)).toBeGreaterThanOrEqual(0);
    expect(home.indexOf(first.slug), 'by home order').toBeLessThan(home.indexOf(later.slug));
    expect(home, 'drafts are never placed').not.toContain(draft.slug);
    expect(await slugs(false), 'hidden from the navigation').not.toContain(first.slug);
  } finally {
    await anonymous.dispose();
  }
});
