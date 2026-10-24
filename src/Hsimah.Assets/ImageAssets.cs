using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;

namespace Hsimah.Assets;

/// <summary>The outcome of an upload: an HTTP status and the JSON body to send.</summary>
public sealed record UploadResult(int Status, object Body);

/// <summary>
/// Image uploads and serving over a store. The caller authorises the request (signed in, CSRF) and passes the file; this checks and
/// normalises it, names it at random, stores it, and serves it back by name with long cache headers.
/// </summary>
public sealed partial class ImageAssets(IAssetStore store, AssetOptions options)
{
    public AssetOptions Options { get; } = options;

    public IAssetStore Store { get; } = store;

    /// <summary>Whether <paramref name="url" /> is the URL of an asset this library stored (<c>/media/&lt;32 hex&gt;.&lt;ext&gt;</c>).</summary>
    public bool IsAssetUrl(string url) => UrlPattern().IsMatch(url) && url.StartsWith(Options.UrlPrefix, StringComparison.Ordinal);

    /// <summary>Whether <paramref name="name" /> is a name this library generates.</summary>
    public static bool IsAssetName(string name) => NamePattern().IsMatch(name);

    public async Task<UploadResult> UploadAsync(Stream upload, CancellationToken cancellationToken)
    {
        using var buffer = new MemoryStream();
        await upload.CopyToAsync(buffer, cancellationToken).ConfigureAwait(false);
        if (buffer.Length > Options.MaxBytes)
        {
            return new UploadResult(413, new { error = $"Images must be {Options.MaxBytes / 1_048_576} MB or smaller." });
        }

        var (image, refusal) = ImageProcessor.Process(buffer.GetBuffer().AsSpan(0, (int)buffer.Length), Options);
        if (image is null)
        {
            return new UploadResult(refusal!.Status, new { error = refusal.Message });
        }

        var name = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant() + "." + image.Extension;
        await Store.PutAsync(name, image.ContentType, image.Content, cancellationToken).ConfigureAwait(false);
        return new UploadResult(201, new { url = Options.UrlPrefix + name });
    }

    /// <summary>Serves <c>/media/&lt;name&gt;</c>; anything that is not a stored name is not found.</summary>
    public async Task ServeAsync(HttpContext http)
    {
        var path = http.Request.Path.Value ?? string.Empty;
        var name = path.StartsWith(Options.UrlPrefix, StringComparison.Ordinal) ? path[Options.UrlPrefix.Length..] : string.Empty;
        var content = IsAssetName(name) ? await Store.OpenAsync(name, http.RequestAborted).ConfigureAwait(false) : null;
        if (content is null)
        {
            http.Response.StatusCode = 404;
            http.Response.ContentType = "text/plain";
            await http.Response.WriteAsync("Not found", http.RequestAborted).ConfigureAwait(false);
            return;
        }

        await using (content.ConfigureAwait(false))
        {
            http.Response.ContentType = ImageProcessor.ContentTypeFor(name[(name.LastIndexOf('.') + 1)..])!;
            http.Response.ContentLength = content.Length;
            http.Response.Headers["X-Content-Type-Options"] = "nosniff";
            http.Response.Headers["Content-Security-Policy"] = "default-src 'none'; sandbox";
            http.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            await content.Content.CopyToAsync(http.Response.Body, http.RequestAborted).ConfigureAwait(false);
        }
    }

    [GeneratedRegex(@"^[a-f0-9]{32}\.(png|jpg|webp)\z")]
    private static partial Regex NamePattern();

    [GeneratedRegex(@"^/[a-z]+/[a-f0-9]{32}\.(png|jpg|webp)\z")]
    private static partial Regex UrlPattern();
}
