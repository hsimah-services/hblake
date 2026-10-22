using Elephentity.Cosmos.Manifest;
using Elephentity.Runtime.Storage;
using Hsimah.Storage;

namespace Hsimah;

/// <summary>
/// The generated Cosmos manifest plus the orderings the application's queries sort by. Cosmos refuses an ORDER BY without a
/// composite index, and the generated manifest only declares single-field orderings for fields marked indexed, so the
/// multi-field orderings of the spec queries (Page.md, PageItem.md) are declared here. Each ends in the same direction of id as the
/// query does; Cosmos serves the exact inverse from the same index.
/// </summary>
public static class StorageManifest
{
    public static CosmosStorageManifest Create(string container)
    {
        var generated = CosmosStorageManifestFactory.Create(container);
        CosmosOrdering[] queries =
        [
            new("Page", [Order.Descending("updatedAt"), Order.Descending("id")]),
            new("Page", [Order.Ascending("navigationOrder"), Order.Ascending("title"), Order.Ascending("id")]),
            new("Page", [Order.Ascending("homeOrder"), Order.Ascending("title"), Order.Ascending("id")]),
            new("PageItem", [Order.Descending("publishedAt"), Order.Descending("id")]),
            new("PageItem", [Order.Descending("updatedAt"), Order.Descending("id")]),
        ];
        return new CosmosStorageManifest(generated.PartitionKey, generated.Entities, [.. generated.Orderings, .. queries], generated.Container);
    }
}
