import { expect, test } from '@playwright/test';

import { Api, expectRejected } from '../../lib/api.ts';
import { KINDS, byId, bySlug, create, createOk, defaults, update, updateOk, uniqueSlug } from '../../lib/content.ts';
import { RUN_ID } from '../../lib/env.ts';

// Field rules from website.md and Product.md (acceptance 6). Every rejection must also
// leave storage untouched.

let api: Api;

test.beforeAll(async () => {
  api = await Api.operator();
});

test.afterAll(async () => {
  await api.dispose();
});

test.describe('slugs', () => {
  const valid = (): string[] => [
    `a${RUN_ID}`,
    `${RUN_ID}-1-2-3`,
    `x${RUN_ID}`.padEnd(160, 'z'),
  ];
  const invalid = (): string[] => [
    '',
    `Upper-${RUN_ID}`,
    `space ${RUN_ID}`,
    `-lead-${RUN_ID}`,
    `trail-${RUN_ID}-`,
    `double--${RUN_ID}`,
    `under_${RUN_ID}`,
    `dot.${RUN_ID}`,
    `slash/${RUN_ID}`,
    `ünï-${RUN_ID}`,
    `y${RUN_ID}`.padEnd(161, 'z'),
  ];

  test('lowercase ASCII letters and digits separated by single hyphens, 1–160 characters, are accepted', async () => {
    for (const slug of valid()) {
      const row = await createOk(api, 'Page', { slug });
      expect(row.slug).toBe(slug);
    }
  });

  test('anything else is rejected on create', async () => {
    for (const slug of invalid()) {
      const result = await create(api, 'Page', defaults('Page', { slug }));
      expectRejected(result, `slug ${JSON.stringify(slug)} should be rejected`);
      if (slug) expect(await bySlug(api, 'Page', slug), `nothing stored for ${JSON.stringify(slug)}`).toBeNull();
    }
  });

  test('anything else is rejected on update', async () => {
    const row = await createOk(api, 'Post');
    for (const slug of invalid()) {
      expectRejected(await update(api, 'Post', row.id, { slug }), `slug ${JSON.stringify(slug)} should be rejected`);
    }
    expect((await byId(api, 'Post', row.id))?.slug).toBe(row.slug);
  });

  for (const kind of KINDS) {
    test(`${kind} slugs are unique within ${kind}`, async () => {
      const first = await createOk(api, kind);
      const duplicate = await create(api, kind, defaults(kind, { slug: first.slug, title: 'Duplicate' }));
      expectRejected(duplicate, 'duplicate slug');
      const second = await createOk(api, kind);
      expectRejected(await update(api, kind, second.id, { slug: first.slug }), 'duplicate slug on update');
      expect((await byId(api, kind, second.id))?.slug).toBe(second.slug);
    });
  }

  test('the same slug may be used by different content kinds', async () => {
    const slug = uniqueSlug('shared');
    for (const kind of KINDS) {
      expect((await createOk(api, kind, { slug })).slug).toBe(slug);
    }
  });

  test('a slug may be changed deliberately', async () => {
    const row = await createOk(api, 'Page');
    const slug = uniqueSlug('renamed');
    expect((await updateOk(api, 'Page', row.id, { slug })).slug).toBe(slug);
    expect(await bySlug(api, 'Page', row.slug)).toBeNull();
  });
});

test.describe('titles', () => {
  for (const title of ['', '   ', '\t\n']) {
    test(`title ${JSON.stringify(title)} is rejected`, async () => {
      const input = defaults('Post', { title });
      expectRejected(await create(api, 'Post', input));
      expect(await bySlug(api, 'Post', input.slug as string)).toBeNull();
    });
  }

  test('a title cannot be blanked on update', async () => {
    const row = await createOk(api, 'Post');
    expectRejected(await update(api, 'Post', row.id, { title: '  ' }));
    expect((await byId(api, 'Post', row.id))?.title).toBe(row.title);
  });

  test('titles are limited to 200 characters', async () => {
    expect((await createOk(api, 'Page', { title: 'T'.repeat(200) })).title).toHaveLength(200);
    const input = defaults('Page', { title: 'T'.repeat(201) });
    expectRejected(await create(api, 'Page', input));
    expect(await bySlug(api, 'Page', input.slug as string)).toBeNull();
  });
});

test.describe('excerpts', () => {
  test('excerpts are limited to 300 characters', async () => {
    expect((await createOk(api, 'Post', { excerpt: 'e'.repeat(300) })).excerpt).toHaveLength(300);
    const input = defaults('Post', { excerpt: 'e'.repeat(301) });
    expectRejected(await create(api, 'Post', input));
    expect(await bySlug(api, 'Post', input.slug as string)).toBeNull();
  });
});

test.describe('bodies', () => {
  test('requests over 1 MiB are refused and nothing is stored', async () => {
    const input = defaults('Post', { content: 'x'.repeat(1024 * 1024 + 1) });
    const result = await create(api, 'Post', input);
    expectRejected(result, 'a body over 1 MiB');
    expect(await bySlug(api, 'Post', input.slug as string)).toBeNull();
  });

  test('a large body under the limit is accepted', async () => {
    const content = `# Large\n\n${'Lorem ipsum dolor sit amet. '.repeat(18_000)}`;
    expect(content.length).toBeLessThan(600_000);
    expect((await createOk(api, 'Post', { content })).content).toBe(content);
  });
});

test.describe('Product enquiry URLs', () => {
  const accepted = ['https://example.com/contact', 'https://example.com/a?b=c#d', 'mailto:hello@example.com'];
  const rejected = [
    'http://example.com',
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://example.com',
    'https://',
    'mailto:',
    'mailto:not-an-address',
    'example.com',
    'not a url',
    `https://example.com/${'a'.repeat(2048)}`,
  ];

  test('HTTPS and valid mailto URLs are accepted', async () => {
    for (const enquiryUrl of accepted) {
      expect((await createOk(api, 'Product', { enquiryUrl })).enquiryUrl).toBe(enquiryUrl);
    }
  });

  test('every other URL is rejected', async () => {
    for (const enquiryUrl of rejected) {
      const input = defaults('Product', { enquiryUrl });
      expectRejected(await create(api, 'Product', input), `enquiryUrl ${enquiryUrl.slice(0, 60)}`);
      expect(await bySlug(api, 'Product', input.slug as string)).toBeNull();
    }
  });

  test('enquiryUrl is optional and can be cleared', async () => {
    const without = await createOk(api, 'Product');
    expect(without.enquiryUrl).toBeNull();
    const withUrl = await createOk(api, 'Product', { enquiryUrl: 'https://example.com/x' });
    expect((await updateOk(api, 'Product', withUrl.id, { enquiryUrl: null })).enquiryUrl).toBeNull();
  });
});

test('omitting a field on update leaves it unchanged', async () => {
  for (const kind of KINDS) {
    const row = await createOk(api, kind, kind === 'Product' ? { enquiryUrl: 'https://example.com/keep' } : {});
    const updated = await updateOk(api, kind, row.id, { title: `${row.title} renamed` });
    expect(updated).toMatchObject({ slug: row.slug, content: row.content, excerpt: row.excerpt });
    if (kind === 'Product') expect(updated.enquiryUrl).toBe('https://example.com/keep');
  }
});
