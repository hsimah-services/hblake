using Hsimah.Http;
using SkiaSharp;

namespace Hsimah.Tests;

public class MediaTests : IDisposable
{
    private readonly string directory = Path.Combine(Path.GetTempPath(), "hsimah-media-test-" + Guid.NewGuid().ToString("N")[..8]);

    public void Dispose()
    {
        if (Directory.Exists(directory))
        {
            Directory.Delete(directory, true);
        }
    }

    [Fact]
    public async Task A_JPEG_is_turned_upright_and_stripped_of_EXIF()
    {
        // A 40×20 JPEG whose EXIF says "rotate 90° clockwise" (orientation 6) and carries a GPS tag.
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
        var spliced = jpeg[..2].Concat(new byte[] { 0xFF, 0xE1, (byte)(length >> 8), (byte)(length & 0xFF) }).Concat(exif).Concat(jpeg[2..]).ToArray();

        var media = new Media(new HsimahOptions { MediaDirectory = directory });
        var stored = await media.StoreAsync(new MemoryStream(spliced), CancellationToken.None);
        Assert.Equal(201, stored.Status);
        var url = (string)stored.Body.GetType().GetProperty("url")!.GetValue(stored.Body)!;
        Assert.Matches(@"^/media/[a-f0-9]{32}\.jpg$", url);
        var file = Path.Combine(directory, Path.GetFileName(url));
        Assert.DoesNotContain("Exif", System.Text.Encoding.Latin1.GetString(await File.ReadAllBytesAsync(file)));
        using var codec = SKCodec.Create(file);
        Assert.Equal((20, 40), (codec.Info.Width, codec.Info.Height));
        Assert.Equal(UnixFileMode.UserRead | UnixFileMode.UserWrite, File.GetUnixFileMode(file));
    }
}
