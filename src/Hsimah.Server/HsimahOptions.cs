namespace Hsimah;

/// <summary>Deployment settings, read from the environment.</summary>
public sealed record HsimahOptions
{
    /// <summary>The Cosmos DB account the emulator listens on by default.</summary>
    public const string EmulatorKey = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

    public string Endpoint { get; init; } = "https://localhost:8081";

    /// <summary>
    /// The account key. Leave it unset to sign in as the application's identity (managed identity in Azure, your <c>az login</c> locally), which
    /// is what a deployment should do; the local emulator needs no key setting either (see <see cref="CosmosAuth" />).
    /// </summary>
    public string? Key { get; init; }

    public string Database { get; init; } = "hsimah";

    public string Container { get; init; } = "hsimah";

    public string AuthContainer { get; init; } = "hsimah-auth";

    /// <summary>True only for the local emulator, whose certificate is self-signed.</summary>
    public bool AllowAnyCertificate { get; init; }

    /// <summary>Where item images are stored: <c>filesystem</c> (the media directory) or <c>blob</c> (Azure Blob Storage).</summary>
    public string AssetStore { get; init; } = "filesystem";

    /// <summary>The Blob Storage account endpoint (https://account.blob.core.windows.net); the server signs in with its managed identity.</summary>
    public string? BlobEndpoint { get; init; }

    /// <summary>A Blob Storage connection string, for Azurite in development and tests. Takes precedence over the endpoint.</summary>
    public string? BlobConnectionString { get; init; }

    public string BlobContainer { get; init; } = "media";

    public string MediaDirectory { get; init; } = Path.Combine(Directory.GetCurrentDirectory(), ".var", "media");

    public string ClientDirectory { get; init; } = Path.Combine(Directory.GetCurrentDirectory(), "client", "dist");

    /// <summary>The bcrypt work factor for new passwords. Each step doubles the cost; the acceptance stack lowers it to keep logins quick.</summary>
    public int PasswordCost { get; init; } = 12;

    public string ContentFile { get; init; } = Path.Combine(Directory.GetCurrentDirectory(), "content", "pages.json");

    public static HsimahOptions FromEnvironment()
    {
        string Get(string name, string fallback) => Environment.GetEnvironmentVariable(name) is { Length: > 0 } value ? value : fallback;
        var defaults = new HsimahOptions();
        return new HsimahOptions
        {
            Endpoint = Get("HSIMAH_COSMOS_ENDPOINT", defaults.Endpoint),
            Key = Environment.GetEnvironmentVariable("HSIMAH_COSMOS_KEY") is { Length: > 0 } key ? key : null,
            Database = Get("HSIMAH_COSMOS_DATABASE", defaults.Database),
            Container = Get("HSIMAH_COSMOS_CONTAINER", defaults.Container),
            AuthContainer = Get("HSIMAH_COSMOS_AUTH_CONTAINER", defaults.AuthContainer),
            AllowAnyCertificate = Get("HSIMAH_COSMOS_ALLOW_ANY_CERTIFICATE", "false") == "true",
            AssetStore = Get("HSIMAH_ASSET_STORE", defaults.AssetStore),
            BlobEndpoint = Environment.GetEnvironmentVariable("HSIMAH_BLOB_ENDPOINT") is { Length: > 0 } endpoint ? endpoint : null,
            BlobConnectionString = Environment.GetEnvironmentVariable("HSIMAH_BLOB_CONNECTION_STRING") is { Length: > 0 } connection ? connection : null,
            BlobContainer = Get("HSIMAH_BLOB_CONTAINER", defaults.BlobContainer),
            MediaDirectory = Get("HSIMAH_MEDIA", defaults.MediaDirectory),
            ClientDirectory = Get("HSIMAH_CLIENT", defaults.ClientDirectory),
            PasswordCost = int.TryParse(Environment.GetEnvironmentVariable("HSIMAH_PASSWORD_COST"), out var cost) && cost is >= 4 and <= 31 ? cost : defaults.PasswordCost,
            ContentFile = Get("HSIMAH_CONTENT", defaults.ContentFile),
        };
    }
}
