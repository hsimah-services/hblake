namespace Hsimah.Assets;

/// <summary>Assets as files in one private directory (mode 0700, files 0600). For development, tests and single-server installs.</summary>
public sealed class FileSystemAssetStore(string directory) : IAssetStore
{
    public async Task PutAsync(string name, string contentType, ReadOnlyMemory<byte> content, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(directory, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
        var target = PathOf(name);
        await File.WriteAllBytesAsync(target, content.ToArray(), cancellationToken).ConfigureAwait(false);
        File.SetUnixFileMode(target, UnixFileMode.UserRead | UnixFileMode.UserWrite);
    }

    public Task<AssetContent?> OpenAsync(string name, CancellationToken cancellationToken)
    {
        var path = PathOf(name);
        if (!File.Exists(path))
        {
            return Task.FromResult<AssetContent?>(null);
        }

        var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous | FileOptions.SequentialScan);
        return Task.FromResult<AssetContent?>(new AssetContent(stream, stream.Length));
    }

    public Task<IReadOnlyList<string>> ListAsync(CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<string>>(Directory.Exists(directory) ? [.. Directory.GetFiles(directory).Select(Path.GetFileName).OfType<string>().Order(StringComparer.Ordinal)] : []);

    public Task DeleteAsync(string name, CancellationToken cancellationToken)
    {
        File.Delete(PathOf(name));
        return Task.CompletedTask;
    }

    // Names come from the generator in this library or from a restored backup; never join an unchecked path.
    private string PathOf(string name) => Path.GetFileName(name) == name ? Path.Combine(directory, name) : throw new ArgumentException("Not an asset name.", nameof(name));
}
