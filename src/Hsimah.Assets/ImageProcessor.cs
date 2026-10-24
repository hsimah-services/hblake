using SkiaSharp;

namespace Hsimah.Assets;

/// <summary>An image that passed every check, normalised and ready to store.</summary>
public sealed record ProcessedImage(string Extension, string ContentType, byte[] Content);

/// <summary>An upload that was refused, with the HTTP status and the message a client may see.</summary>
public sealed record ImageRefusal(int Status, string Message);

/// <summary>
/// Checks an image by its content (PNG, JPEG or WebP, never by name or declared type), bounds its pixels, turns it upright from its
/// EXIF orientation and re-encodes it, which drops EXIF, location and any other embedded data.
/// </summary>
public static class ImageProcessor
{
    public static (ProcessedImage? Image, ImageRefusal? Refusal) Process(ReadOnlySpan<byte> bytes, AssetOptions options)
    {
        var extension = Sniff(bytes);
        if (extension is null)
        {
            return (null, new ImageRefusal(415, "Use a PNG, JPEG or WebP image."));
        }

        using var data = SKData.CreateCopy(bytes);
        using var codec = SKCodec.Create(data);
        if (codec is null || codec.Info.Width < 1 || codec.Info.Height < 1)
        {
            return (null, new ImageRefusal(415, "That file is not a readable image."));
        }

        if (codec.Info.Width > options.MaxPixels || codec.Info.Height > options.MaxPixels)
        {
            return (null, new ImageRefusal(413, $"Images must be at most {options.MaxPixels} pixels on each side."));
        }

        using var decoded = SKBitmap.Decode(codec);
        if (decoded is null)
        {
            return (null, new ImageRefusal(415, "That file is not a readable image."));
        }

        using var upright = extension == "jpg" ? Upright(decoded, codec.EncodedOrigin) : null;
        using var image = SKImage.FromBitmap(upright ?? decoded);
        using var encoded = extension switch
        {
            "png" => image.Encode(SKEncodedImageFormat.Png, 100),
            "webp" => image.Encode(SKEncodedImageFormat.Webp, 85),
            _ => image.Encode(SKEncodedImageFormat.Jpeg, 85),
        } ?? throw new InvalidOperationException("Could not encode the image.");
        return (new ProcessedImage(extension, ContentTypeOf(extension), encoded.ToArray()), null);
    }

    public static string? ContentTypeFor(string extension) => extension switch
    {
        "png" => "image/png",
        "jpg" => "image/jpeg",
        "webp" => "image/webp",
        _ => null,
    };

    private static string ContentTypeOf(string extension) => ContentTypeFor(extension)!;

    private static ReadOnlySpan<byte> PngSignature => [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    private static ReadOnlySpan<byte> JpegSignature => [0xFF, 0xD8, 0xFF];

    private static string? Sniff(ReadOnlySpan<byte> bytes)
    {
        if (bytes.StartsWith(PngSignature))
        {
            return "png";
        }

        if (bytes.StartsWith(JpegSignature))
        {
            return "jpg";
        }

        return bytes.Length >= 12 && bytes[..4].SequenceEqual("RIFF"u8) && bytes.Slice(8, 4).SequenceEqual("WEBP"u8) ? "webp" : null;
    }

    /// <summary>The image turned so it displays upright, or null when it already does.</summary>
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
}
