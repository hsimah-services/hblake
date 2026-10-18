import type { APIResponse } from '@playwright/test';

import type { Api } from './api.ts';

// Post images (tests/README.md, "Media"): fixtures and the upload request.

/** A 4×4 PNG. */
export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAADElEQVQImWNgIB0AAAA0AAEjQ4N1AAAAAElFTkSuQmCC', 'base64');

/** An 8×8 JPEG. */
export const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gODAK/9sAQwAGBAUGBQQGBgUGBwcGCAoQCgoJCQoUDg8MEBcUGBgXFBYWGh0lHxobIxwWFiAsICMmJykqKRkfLTAtKDAlKCko/9sAQwEHBwcKCAoTCgoTKBoWGigoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgo/8AAEQgACAAIAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A5eiiivkj9SP/2Q==', 'base64');

/**
 * The JPEG with an EXIF segment carrying an orientation, a GPS pointer and a marker string,
 * spliced in after the start-of-image marker as a camera would write it.
 */
export function jpegWithExif(): Buffer {
  const marker = Buffer.from('SECRET-GPS-48.8584N-2.2945E');
  const tiff = Buffer.concat([
    Buffer.from('MM\x00\x2A\x00\x00\x00\x08', 'latin1'),
    Buffer.from([0x00, 0x02, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x88, 0x25, 0x00, 0x04, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    marker,
  ]);
  const exif = Buffer.concat([Buffer.from('Exif\x00\x00', 'latin1'), tiff]);
  const length = Buffer.alloc(2);
  length.writeUInt16BE(exif.length + 2);
  return Buffer.concat([JPEG.subarray(0, 2), Buffer.from([0xff, 0xe1]), length, exif, JPEG.subarray(2)]);
}

/** POST /media as multipart field `image`, with the CSRF token unless `csrf` is false. */
export async function upload(api: Api, file: { name: string; mimeType: string; buffer: Buffer }, options: { csrf?: boolean } = {}): Promise<APIResponse> {
  const headers: Record<string, string> = {};
  if (options.csrf !== false) headers['X-CSRF-Token'] = await api.csrfToken(true);
  return api.ctx.post('/media', { multipart: { image: file }, headers });
}
