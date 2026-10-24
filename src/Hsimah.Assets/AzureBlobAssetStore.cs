using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace Hsimah.Assets;

/// <summary>
/// Assets as blobs in one private container. Create the client with a managed identity (<c>new BlobServiceClient(endpoint, new
/// DefaultAzureCredential())</c>) in Azure, or a connection string against Azurite locally. The container is created on first use.
/// </summary>
public sealed class AzureBlobAssetStore(BlobContainerClient container) : IAssetStore
{
    private readonly SemaphoreSlim gate = new(1, 1);
    private bool ready;

    public async Task PutAsync(string name, string contentType, ReadOnlyMemory<byte> content, CancellationToken cancellationToken)
    {
        await EnsureAsync(cancellationToken).ConfigureAwait(false);
        using var stream = new MemoryStream(content.ToArray(), writable: false);
        await container.GetBlobClient(name).UploadAsync(stream, new BlobUploadOptions { HttpHeaders = new BlobHttpHeaders { ContentType = contentType } }, cancellationToken).ConfigureAwait(false);
    }

    public async Task<AssetContent?> OpenAsync(string name, CancellationToken cancellationToken)
    {
        try
        {
            await EnsureAsync(cancellationToken).ConfigureAwait(false);
            var result = await container.GetBlobClient(name).DownloadStreamingAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
            return new AssetContent(result.Value.Content, result.Value.Details.ContentLength);
        }
        catch (RequestFailedException error) when (error.Status == 404)
        {
            return null;
        }
    }

    public async Task<IReadOnlyList<string>> ListAsync(CancellationToken cancellationToken)
    {
        await EnsureAsync(cancellationToken).ConfigureAwait(false);
        var names = new List<string>();
        await foreach (var blob in container.GetBlobsAsync(cancellationToken: cancellationToken).ConfigureAwait(false))
        {
            names.Add(blob.Name);
        }

        return names.Order(StringComparer.Ordinal).ToList();
    }

    public async Task DeleteAsync(string name, CancellationToken cancellationToken)
    {
        await EnsureAsync(cancellationToken).ConfigureAwait(false);
        await container.GetBlobClient(name).DeleteIfExistsAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    private async Task EnsureAsync(CancellationToken cancellationToken)
    {
        if (ready)
        {
            return;
        }

        await gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (!ready)
            {
                await container.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken).ConfigureAwait(false);
                ready = true;
            }
        }
        finally
        {
            gate.Release();
        }
    }
}
