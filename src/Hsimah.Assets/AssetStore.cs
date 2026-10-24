namespace Hsimah.Assets;

/// <summary>An asset opened for reading. The caller disposes it.</summary>
public sealed class AssetContent(Stream content, long length) : IAsyncDisposable
{
    public Stream Content { get; } = content;

    public long Length { get; } = length;

    public ValueTask DisposeAsync() => Content.DisposeAsync();
}

/// <summary>
/// Where stored assets live. A name is the whole key (<c>&lt;32 hex&gt;.&lt;png|jpg|webp&gt;</c>); the store neither makes nor checks
/// names, and returns null or no-ops for ones it does not hold.
/// </summary>
public interface IAssetStore
{
    Task PutAsync(string name, string contentType, ReadOnlyMemory<byte> content, CancellationToken cancellationToken);

    Task<AssetContent?> OpenAsync(string name, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> ListAsync(CancellationToken cancellationToken);

    Task DeleteAsync(string name, CancellationToken cancellationToken);
}
