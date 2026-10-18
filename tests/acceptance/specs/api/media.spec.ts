import { expect, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { JPEG, PNG, jpegWithExif, upload } from '../../lib/media.ts';

// Post images (spec/website.md, issue #14): staff upload PNG, JPEG or WebP images to
// POST /media; the server checks them by content, bounds their size, strips metadata by
// re-encoding and stores them under random names that GET /media/<name> serves.

let operator: Api;

test.beforeAll(async () => {
  operator = await Api.operator();
});

test.afterAll(async () => {
  await operator.dispose();
});

const MEDIA_URL = /^\/media\/[a-f0-9]{32}\.(png|jpg|webp)$/;

test('uploads need the CSRF token and a signed-in staff session', async () => {
  const withoutToken = await upload(operator, { name: 'a.png', mimeType: 'image/png', buffer: PNG }, { csrf: false });
  expect(withoutToken.status()).toBe(403);
  const anonymous = await Api.anonymous();
  const signedOut = await upload(anonymous, { name: 'a.png', mimeType: 'image/png', buffer: PNG });
  expect(signedOut.status()).toBe(403);
  await anonymous.dispose();
});

test('an image is stored under a random name and served safely', async () => {
  const response = await upload(operator, { name: 'holiday photo.png', mimeType: 'image/png', buffer: PNG });
  expect(response.status(), await response.text()).toBe(201);
  const { url } = await response.json() as { url: string };
  expect(url).toMatch(MEDIA_URL);
  expect(url).toMatch(/\.png$/);
  expect(url).not.toContain('holiday');

  const anonymous = await Api.anonymous();
  const served = await anonymous.ctx.get(url);
  expect(served.status()).toBe(200);
  expect(served.headers()['content-type']).toBe('image/png');
  expect(served.headers()['x-content-type-options']).toBe('nosniff');
  expect(served.headers()['cache-control'] ?? '').toMatch(/max-age=\d+/);
  expect((await served.body()).subarray(0, 8)).toEqual(PNG.subarray(0, 8));
  await anonymous.dispose();
});

test('the type comes from the content, not the name or declared type', async () => {
  const disguised = await upload(operator, { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: PNG });
  expect(disguised.status()).toBe(201);
  expect((await disguised.json()).url).toMatch(/\.png$/);
  for (const [name, buffer] of [['notes.png', Buffer.from('just some text, not an image')], ['page.png', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')]] as const) {
    const refused = await upload(operator, { name, mimeType: 'image/png', buffer });
    expect(refused.status(), name).toBe(415);
    expect((await refused.json()).error, name).toMatch(/PNG, JPEG or WebP|not a readable image/);
  }
});

test('images larger than 5 MB are refused', async () => {
  const large = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024 + 1024, 1)]);
  const response = await upload(operator, { name: 'large.png', mimeType: 'image/png', buffer: large });
  expect(response.status()).toBe(413);
  expect((await response.json()).error).toMatch(/5 MB/);
});

test('camera and location metadata is removed', async () => {
  const original = jpegWithExif();
  expect(original.includes(Buffer.from('SECRET-GPS'))).toBe(true);
  const response = await upload(operator, { name: 'phone.jpg', mimeType: 'image/jpeg', buffer: original });
  expect(response.status(), await response.text()).toBe(201);
  const { url } = await response.json() as { url: string };
  const served = await (await operator.ctx.get(url)).body();
  expect(served.subarray(0, 2)).toEqual(JPEG.subarray(0, 2));
  expect(served.includes(Buffer.from('Exif')), 'no EXIF segment').toBe(false);
  expect(served.includes(Buffer.from('SECRET-GPS')), 'no location text').toBe(false);
});

test('only stored names are served', async () => {
  const anonymous = await Api.anonymous();
  for (const path of ['/media/0123456789abcdef0123456789abcdef.png', '/media/site.sqlite', '/media/ABCDEF0123456789abcdef0123456789.png', '/media/']) {
    expect((await anonymous.ctx.get(path)).status(), path).toBe(404);
  }
  // Clients normalise dot segments, so these leave /media/ entirely; whatever answers,
  // it is never the database or a file from outside the media directory.
  for (const path of ['/media/../.var/site.sqlite', '/media/%2e%2e/site.sqlite', '/media/..%2f..%2f.var%2fsite.sqlite']) {
    const response = await anonymous.ctx.get(path);
    expect((await response.body()).subarray(0, 15).toString(), path).not.toBe('SQLite format 3');
    expect(response.headers()['content-type'] ?? '', path).not.toMatch(/^image\//);
  }
  await anonymous.dispose();
});
