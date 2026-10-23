using Microsoft.Playwright;

namespace Hsimah.Acceptance.Lib;

/// <summary>Post images (tests/README.md, "Media"): fixtures and the upload request.</summary>
public static class Images
{
    /// <summary>A 4×4 PNG.</summary>
    public static readonly byte[] Png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAADElEQVQImWNgIB0AAAA0AAEjQ4N1AAAAAElFTkSuQmCC");

    /// <summary>An 8×8 JPEG.</summary>
    public static readonly byte[] Jpeg = Convert.FromBase64String("/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gODAK/9sAQwAGBAUGBQQGBgUGBwcGCAoQCgoJCQoUDg8MEBcUGBgXFBYWGh0lHxobIxwWFiAsICMmJykqKRkfLTAtKDAlKCko/9sAQwEHBwcKCAoTCgoTKBoWGigoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgo/8AAEQgACAAIAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A5eiiivkj9SP/2Q==");

    /// <summary>
    /// The JPEG with an EXIF segment carrying an orientation, a GPS pointer and a marker string, spliced in after the start-of-image
    /// marker as a camera would write it.
    /// </summary>
    public static byte[] JpegWithExif()
    {
        var marker = "SECRET-GPS-48.8584N-2.2945E"u8.ToArray();
        byte[] header = [(byte)'M', (byte)'M', 0x00, 0x2A, 0x00, 0x00, 0x00, 0x08];
        byte[] entries = [0x00, 0x02, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x88, 0x25, 0x00, 0x04, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        byte[] exifHeader = [(byte)'E', (byte)'x', (byte)'i', (byte)'f', 0x00, 0x00];
        var exif = exifHeader.Concat(header).Concat(entries).Concat(marker).ToArray();
        var length = exif.Length + 2;
        byte[] segment = [0xff, 0xe1, (byte)(length >> 8), (byte)(length & 0xff)];
        return Jpeg[..2].Concat(segment).Concat(exif).Concat(Jpeg[2..]).ToArray();
    }

    /// <summary>POST /media as multipart field `image`, with the CSRF token unless <paramref name="csrfHeader" /> is false.</summary>
    public static async Task<IAPIResponse> Upload(Api api, string name, string mimeType, byte[] buffer, bool csrfHeader = true)
    {
        var headers = new Dictionary<string, string>();
        if (csrfHeader)
        {
            headers["X-CSRF-Token"] = await api.CsrfToken(true);
        }

        var form = api.Context.CreateFormData();
        form.Set("image", new FilePayload { Name = name, MimeType = mimeType, Buffer = buffer });
        return await api.Context.PostAsync("/media", new APIRequestContextOptions { Multipart = form, Headers = headers });
    }
}
