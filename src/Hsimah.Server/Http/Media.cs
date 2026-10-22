using System.Security.Cryptography;
using System.Text.RegularExpressions;
using SkiaSharp;

namespace Hsimah.Http;

/// <summary>
/// Images for item bodies. Uploads are staff-only and CSRF-protected. Each is checked by content (PNG, JPEG or WebP), bounded in
/// bytes and pixels, turned upright and re-encoded, which drops EXIF, location and any other embedded data, then stored under a
/// random name in a private directory and served by this class.
/// </summary>
public sealed partial class Media(HsimahOptions options)
{
    public const long MaxBytes = 5_242_880;
    public const int MaxPixels = 8000;

    private static readonly Dictionary<string, string> Served = new() { ["png"] = "image/png", ["jpg"] = "image/jpeg", ["webp"] = "image/webp" };

    public sealed record Stored(int Status, object Body);

    /// <summary>Validates and re-encodes an uploaded image; returns its public URL, or the refusal.</summary>
    public async Task<Stored> StoreAsync(Stream upload, CancellationToken token)
    {
        using var buffer = new MemoryStream();
        await upload.CopyToAsync(buffer, token).ConfigureAwait(false);
        var bytes = buffer.ToArray();
        var extension = Sniff(bytes);
        if (extension is null)
        {
            return new Stored(415, new { error = "Use a PNG, JPEG or WebP image." });
        }

        using var data = SKData.CreateCopy(bytes);
        using var codec = SKCodec.Create(data);
        if (codec is null || codec.Info.Width < 1 || codec.Info.Height < 1)
        {
            return new Stored(415, new { error = "That file is not a readable image." });
        }

        if (codec.Info.Width > MaxPixels || codec.Info.Height > MaxPixels)
        {
            return new Stored(413, new { error = "Images must be at most 8000 pixels on each side." });
        }

        using var decoded = SKBitmap.Decode(codec);
        if (decoded is null)
        {
            return new Stored(415, new { error = "That file is not a readable image." });
        }

        using var upright = extension == "jpg" ? Upright(decoded, codec.EncodedOrigin) : null;
        var source = upright ?? decoded;
        using var image = SKImage.FromBitmap(source);
        using var encoded = extension switch
        {
            "png" => image.Encode(SKEncodedImageFormat.Png, 100),
            "webp" => image.Encode(SKEncodedImageFormat.Webp, 85),
            _ => image.Encode(SKEncodedImageFormat.Jpeg, 85),
        };
        if (encoded is null)
        {
            throw new InvalidOperationException("Could not encode the image.");
        }

        Directory.CreateDirectory(options.MediaDirectory, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
        var name = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant() + "." + extension;
        var target = Path.Combine(options.MediaDirectory, name);
        await File.WriteAllBytesAsync(target, encoded.ToArray(), token).ConfigureAwait(false);
        File.SetUnixFileMode(target, UnixFileMode.UserRead | UnixFileMode.UserWrite);
        return new Stored(201, new { url = "/media/" + name });
    }

    /// <summary>Serves /media/&lt;32 hex&gt;.&lt;png|jpg|webp&gt;; anything else is not found.</summary>
    public async Task ServeAsync(HttpContext http)
    {
        var match = MediaPath().Match(http.Request.Path.Value ?? string.Empty);
        var file = match.Success ? Path.Combine(options.MediaDirectory, match.Groups[1].Value + "." + match.Groups[2].Value) : null;
        if (file is null || !File.Exists(file))
        {
            http.Response.StatusCode = 404;
            http.Response.ContentType = "text/plain";
            await http.Response.WriteAsync("Not found", http.RequestAborted).ConfigureAwait(false);
            return;
        }

        http.Response.ContentType = Served[match.Groups[2].Value];
        http.Response.Headers["X-Content-Type-Options"] = "nosniff";
        http.Response.Headers["Content-Security-Policy"] = "default-src 'none'; sandbox";
        http.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        await http.Response.SendFileAsync(file, http.RequestAborted).ConfigureAwait(false);
    }

    private static string? Sniff(byte[] bytes) => bytes switch
    {
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ..] => "png",
        [0xFF, 0xD8, 0xFF, ..] => "jpg",
        [(byte)'R', (byte)'I', (byte)'F', (byte)'F', _, _, _, _, (byte)'W', (byte)'E', (byte)'B', (byte)'P', ..] => "webp",
        _ => null,
    };

    /// <summary>The image turned so it displays upright, from its EXIF orientation.</summary>
    private static SKBitmap? Upright(SKBitmap bitmap, SKEncodedOrigin origin)
    {
        if (origin is SKEncodedOrigin.TopLeft or SKEncodedOrigin.Default)
        {
            return null;
        }

        float w = bitmap.Width, h = bitmap.Height;
        var (matrix, swap) = origin switch
        {
            SKEncodedOrigin.TopRight => (new SKMatrix(-1, 0, w, 0, 1, 0, 0, 0, 1), false),
            SKEncodedOrigin.BottomRight => (new SKMatrix(-1, 0, w, 0, -1, h, 0, 0, 1), false),
            SKEncodedOrigin.BottomLeft => (new SKMatrix(1, 0, 0, 0, -1, h, 0, 0, 1), false),
            SKEncodedOrigin.LeftTop => (new SKMatrix(0, 1, 0, 1, 0, 0, 0, 0, 1), true),
            SKEncodedOrigin.RightTop => (new SKMatrix(0, -1, h, 1, 0, 0, 0, 0, 1), true),
            SKEncodedOrigin.RightBottom => (new SKMatrix(0, -1, h, -1, 0, w, 0, 0, 1), true),
            SKEncodedOrigin.LeftBottom => (new SKMatrix(0, 1, 0, -1, 0, w, 0, 0, 1), true),
            _ => (SKMatrix.Identity, false),
        };
        var result = new SKBitmap(swap ? bitmap.Height : bitmap.Width, swap ? bitmap.Width : bitmap.Height, bitmap.ColorType, bitmap.AlphaType);
        using var canvas = new SKCanvas(result);
        canvas.SetMatrix(matrix);
        using var source = SKImage.FromBitmap(bitmap);
        canvas.DrawImage(source, 0, 0, new SKSamplingOptions(), null);
        return result;
    }

    [GeneratedRegex(@"^/media/([a-f0-9]{32})\.(png|jpg|webp)\z")]
    private static partial Regex MediaPath();
}
