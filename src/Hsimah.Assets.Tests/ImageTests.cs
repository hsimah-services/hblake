using System.Text;
using Microsoft.AspNetCore.Http;
using SkiaSharp;

[assembly: System.Runtime.Versioning.UnsupportedOSPlatform("windows")]

namespace Hsimah.Assets.Tests;

public class ImageTests : IDisposable
{
    private readonly string directory = Path.Combine(Path.GetTempPath(), "hsimah-assets-test-" + Guid.NewGuid().ToString("N")[..8]);

    public void Dispose()
    {
        if (Directory.Exists(directory))
        {
            Directory.Delete(directory, true);
        }
    }

    private ImageAssets Assets() => new(new FileSystemAssetStore(directory), new AssetOptions());

    private static byte[] Png(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height);
        bitmap.Erase(SKColors.Teal);
        using var data = SKImage.FromBitmap(bitmap).Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }

    /// <summary>A 40×20 JPEG whose EXIF says "rotate 90° clockwise" (orientation 6) and carries a GPS tag.</summary>
    private static byte[] JpegWithExif()
    {
        using var bitmap = new SKBitmap(40, 20);
        bitmap.Erase(SKColors.Teal);
        using var data = SKImage.FromBitmap(bitmap).Encode(SKEncodedImageFormat.Jpeg, 90);
        var jpeg = data.ToArray();
        byte[] tiff =
        [
            (byte)'M', (byte)'M', 0, 0x2A, 0, 0, 0, 0x08, 0, 0x02,
            0x01, 0x12, 0, 0x03, 0, 0, 0, 0x01, 0, 0x06, 0, 0,
            0x88, 0x25, 0, 0x04, 0, 0, 0, 0x01, 0, 0, 0, 0,
            0, 0, 0, 0,
        ];
        byte[] exif = [.. "Exif\0\0"u8.ToArray(), .. tiff];
        var length = exif.Length + 2;
        return [.. jpeg[..2], 0xFF, 0xE1, (byte)(length >> 8), (byte)(length & 0xFF), .. exif, .. jpeg[2..]];
    }

    [Fact]
    public async Task A_JPEG_is_turned_upright_and_stripped_of_EXIF()
    {
        var stored = await Assets().UploadAsync(new MemoryStream(JpegWithExif()), CancellationToken.None);
        Assert.Equal(201, stored.Status);
        var url = (string)stored.Body.GetType().GetProperty("url")!.GetValue(stored.Body)!;
        Assert.Matches(@"^/media/[a-f0-9]{32}\.jpg$", url);
        var file = Path.Combine(directory, Path.GetFileName(url));
        Assert.DoesNotContain("Exif", Encoding.Latin1.GetString(await File.ReadAllBytesAsync(file)));
        using var codec = SKCodec.Create(file);
        Assert.Equal((20, 40), (codec.Info.Width, codec.Info.Height));
        Assert.Equal(UnixFileMode.UserRead | UnixFileMode.UserWrite, File.GetUnixFileMode(file));
    }

    [Fact]
    public void The_type_comes_from_the_content()
    {
        var options = new AssetOptions();
        Assert.Equal("png", ImageProcessor.Process(Png(4, 4), options).Image?.Extension);
        Assert.Equal(415, ImageProcessor.Process("just some text, not an image"u8, options).Refusal?.Status);
        Assert.Equal(415, ImageProcessor.Process("<svg xmlns=\"http://www.w3.org/2000/svg\"/>"u8, options).Refusal?.Status);
        Assert.Equal(415, ImageProcessor.Process(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3 }, options).Refusal?.Status);
    }

    [Fact]
    public async Task Images_over_the_limits_are_refused()
    {
        var assets = new ImageAssets(new FileSystemAssetStore(directory), new AssetOptions { MaxPixels = 16, MaxBytes = 1000 });
        Assert.Equal(413, (await assets.UploadAsync(new MemoryStream(Png(17, 4)), CancellationToken.None)).Status);
        Assert.Equal(413, (await assets.UploadAsync(new MemoryStream(new byte[1001]), CancellationToken.None)).Status);
        Assert.Equal(201, (await assets.UploadAsync(new MemoryStream(Png(16, 4)), CancellationToken.None)).Status);
    }

    [Fact]
    public void Only_generated_names_and_urls_are_assets()
    {
        var assets = Assets();
        Assert.True(assets.IsAssetUrl("/media/0123456789abcdef0123456789abcdef.png"));
        foreach (var url in new[] { "/media/../etc/passwd", "/media/ABCDEF0123456789abcdef0123456789.png", "/media/0123456789abcdef0123456789abcdef.svg", "https://example.com/a.png", "/other/0123456789abcdef0123456789abcdef.png" })
        {
            Assert.False(assets.IsAssetUrl(url), url);
        }

        Assert.False(ImageAssets.IsAssetName("../x.png"));
    }

    [Fact]
    public async Task A_stored_image_is_served_safely_and_other_names_are_not_found()
    {
        var assets = Assets();
        var stored = await assets.UploadAsync(new MemoryStream(Png(4, 4)), CancellationToken.None);
        var url = (string)stored.Body.GetType().GetProperty("url")!.GetValue(stored.Body)!;

        var http = new DefaultHttpContext();
        http.Request.Path = url;
        http.Response.Body = new MemoryStream();
        await assets.ServeAsync(http);
        Assert.Equal("image/png", http.Response.ContentType);
        Assert.Equal("nosniff", http.Response.Headers["X-Content-Type-Options"]);
        Assert.Contains("max-age=31536000", http.Response.Headers.CacheControl.ToString());
        Assert.True(http.Response.Body.Length > 0);

        foreach (var path in new[] { "/media/0123456789abcdef0123456789abcdef.png", "/media/site.sqlite", "/media/", "/media/../x" })
        {
            var missing = new DefaultHttpContext();
            missing.Request.Path = path;
            missing.Response.Body = new MemoryStream();
            await assets.ServeAsync(missing);
            Assert.Equal(404, missing.Response.StatusCode);
        }
    }

    [Fact]
    public async Task The_filesystem_store_lists_reads_and_deletes_by_name()
    {
        var store = new FileSystemAssetStore(directory);
        await store.PutAsync("a.png", "image/png", new byte[] { 1, 2, 3 }, CancellationToken.None);
        await store.PutAsync("b.png", "image/png", new byte[] { 4 }, CancellationToken.None);
        Assert.Equal(["a.png", "b.png"], await store.ListAsync(CancellationToken.None));
        await using (var content = await store.OpenAsync("a.png", CancellationToken.None))
        {
            Assert.Equal(3, content!.Length);
        }

        await store.DeleteAsync("a.png", CancellationToken.None);
        Assert.Null(await store.OpenAsync("a.png", CancellationToken.None));
        await Assert.ThrowsAsync<ArgumentException>(() => store.PutAsync("../escape.png", "image/png", new byte[1], CancellationToken.None));
    }
}
