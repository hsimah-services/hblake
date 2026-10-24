namespace Hsimah.Assets;

public sealed record AssetOptions
{
    /// <summary>The largest upload accepted, in bytes.</summary>
    public long MaxBytes { get; init; } = 5_242_880;

    /// <summary>The largest width or height accepted, in pixels.</summary>
    public int MaxPixels { get; init; } = 8000;

    /// <summary>The URL prefix assets are served under, with both slashes.</summary>
    public string UrlPrefix { get; init; } = "/media/";
}
