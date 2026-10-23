using System.Text;
using System.Text.RegularExpressions;

namespace Hsimah.Acceptance.Http;

// Item images (spec/website.md, issue #14): staff upload PNG, JPEG or WebP images to POST /media; the server checks them by
// content, bounds their size, strips metadata by re-encoding and stores them under random names that GET /media/<name> serves.
public partial class MediaTests : OperatorTest
{
    [Fact]
    public async Task Uploads_need_the_CSRF_token_and_a_signed_in_staff_session()
    {
        var withoutToken = await Images.Upload(api, "a.png", "image/png", Images.Png, csrfHeader: false);
        Assert.Equal(403, withoutToken.Status);
        await using var anonymous = await Api.Anonymous();
        var signedOut = await Images.Upload(anonymous, "a.png", "image/png", Images.Png);
        Assert.Equal(403, signedOut.Status);
    }

    [Fact]
    public async Task An_image_is_stored_under_a_random_name_and_served_safely()
    {
        var response = await Images.Upload(api, "holiday photo.png", "image/png", Images.Png);
        Assert.True(response.Status == 201, await response.TextAsync());
        var url = (await response.JsonAsync())!.Value.GetProperty("url").GetString()!;
        Assert.Matches(MediaUrl(), url);
        Assert.EndsWith(".png", url);
        Assert.DoesNotContain("holiday", url);

        await using var anonymous = await Api.Anonymous();
        var served = await anonymous.Context.GetAsync(url);
        Assert.Equal(200, served.Status);
        Assert.Equal("image/png", served.Headers["content-type"]);
        Assert.Equal("nosniff", served.Headers["x-content-type-options"]);
        Assert.Matches(@"max-age=\d+", served.Headers.GetValueOrDefault("cache-control") ?? "");
        Assert.Equal(Images.Png[..8], (await served.BodyAsync())[..8]);
    }

    [Fact]
    public async Task The_type_comes_from_the_content_not_the_name_or_declared_type()
    {
        var disguised = await Images.Upload(api, "photo.jpg", "image/jpeg", Images.Png);
        Assert.Equal(201, disguised.Status);
        Assert.EndsWith(".png", (await disguised.JsonAsync())!.Value.GetProperty("url").GetString()!);
        var refusals = new (string Name, byte[] Buffer)[]
        {
            ("notes.png", Encoding.UTF8.GetBytes("just some text, not an image")),
            ("page.png", Encoding.UTF8.GetBytes("<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>")),
        };
        foreach (var (name, buffer) in refusals)
        {
            var refused = await Images.Upload(api, name, "image/png", buffer);
            Assert.True(refused.Status == 415, name);
            Assert.Matches("PNG, JPEG or WebP|not a readable image", (await refused.JsonAsync())!.Value.GetProperty("error").GetString()!);
        }
    }

    [Fact]
    public async Task Images_larger_than_5_MB_are_refused()
    {
        var large = Images.Png.Concat(Enumerable.Repeat((byte)1, (5 * 1024 * 1024) + 1024)).ToArray();
        var response = await Images.Upload(api, "large.png", "image/png", large);
        Assert.Equal(413, response.Status);
        Assert.Matches("5 MB", (await response.JsonAsync())!.Value.GetProperty("error").GetString()!);
    }

    [Fact]
    public async Task Camera_and_location_metadata_is_removed()
    {
        var original = Images.JpegWithExif();
        Assert.True(Contains(original, "SECRET-GPS"));
        var response = await Images.Upload(api, "phone.jpg", "image/jpeg", original);
        Assert.True(response.Status == 201, await response.TextAsync());
        var url = (await response.JsonAsync())!.Value.GetProperty("url").GetString()!;
        var served = await (await api.Context.GetAsync(url)).BodyAsync();
        Assert.Equal(Images.Jpeg[..2], served[..2]);
        Assert.False(Contains(served, "Exif"), "no EXIF segment");
        Assert.False(Contains(served, "SECRET-GPS"), "no location text");
    }

    [Fact]
    public async Task Only_stored_names_are_served()
    {
        await using var anonymous = await Api.Anonymous();
        foreach (var path in new[] { "/media/0123456789abcdef0123456789abcdef.png", "/media/site.sqlite", "/media/ABCDEF0123456789abcdef0123456789.png", "/media/" })
        {
            Assert.True((await anonymous.Context.GetAsync(path)).Status == 404, path);
        }

        // Clients normalise dot segments, so these leave /media/ entirely; whatever answers, it is never the database or a file from
        // outside the media directory.
        foreach (var path in new[] { "/media/../.var/site.sqlite", "/media/%2e%2e/site.sqlite", "/media/..%2f..%2f.var%2fsite.sqlite" })
        {
            var response = await anonymous.Context.GetAsync(path);
            var head = Encoding.Latin1.GetString((await response.BodyAsync()).Take(15).ToArray());
            Assert.True(head != "SQLite format 3", path);
            Assert.DoesNotMatch("^image/", response.Headers.GetValueOrDefault("content-type") ?? "");
        }
    }

    private static bool Contains(byte[] haystack, string needle) => haystack.AsSpan().IndexOf(Encoding.UTF8.GetBytes(needle)) >= 0;

    [GeneratedRegex(@"^/media/[a-f0-9]{32}\.(png|jpg|webp)$")]
    private static partial Regex MediaUrl();
}
