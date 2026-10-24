using Azure.Identity;
using Azure.Storage.Blobs;
using Hsimah.Assets;

namespace Hsimah;

/// <summary>Chooses the asset store from the settings: Blob Storage in Azure (managed identity), Azurite by connection string, or a directory.</summary>
public static class AssetStores
{
    public static IAssetStore Create(HsimahOptions options) => options.AssetStore switch
    {
        "filesystem" => new FileSystemAssetStore(options.MediaDirectory),
        "blob" when options.BlobConnectionString is { } connection => new AzureBlobAssetStore(new BlobContainerClient(connection, options.BlobContainer)),
        "blob" when options.BlobEndpoint is { } endpoint => new AzureBlobAssetStore(
            new BlobServiceClient(new Uri(endpoint), new DefaultAzureCredential()).GetBlobContainerClient(options.BlobContainer)),
        "blob" => throw new InvalidOperationException("HSIMAH_ASSET_STORE=blob needs HSIMAH_BLOB_ENDPOINT or HSIMAH_BLOB_CONNECTION_STRING."),
        var other => throw new InvalidOperationException($"HSIMAH_ASSET_STORE must be \"filesystem\" or \"blob\", not \"{other}\"."),
    };
}
