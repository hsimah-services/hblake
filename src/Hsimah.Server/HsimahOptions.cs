namespace Hsimah;

/// <summary>Deployment settings, read from the environment.</summary>
public sealed record HsimahOptions
{
    /// <summary>The Cosmos DB account the emulator listens on by default.</summary>
    public const string EmulatorKey = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

    public string Endpoint { get; init; } = "https://localhost:8081";

    public string Key { get; init; } = EmulatorKey;

    public string Database { get; init; } = "hsimah";

    public string Container { get; init; } = "hsimah";

    public string AuthContainer { get; init; } = "hsimah-auth";

    /// <summary>True only for the local emulator, whose certificate is self-signed.</summary>
    public bool AllowAnyCertificate { get; init; }

    public string MediaDirectory { get; init; } = Path.Combine(Directory.GetCurrentDirectory(), ".var", "media");

    public string ClientDirectory { get; init; } = Path.Combine(Directory.GetCurrentDirectory(), "client", "dist");

    public string RouteManifest { get; init; } = Path.Combine(Directory.GetCurrentDirectory(), "client", "src", "routes", "__generated__", "routes.manifest.json");

    public string ContentFile { get; init; } = Path.Combine(Directory.GetCurrentDirectory(), "content", "pages.json");

    public static HsimahOptions FromEnvironment()
    {
        string Get(string name, string fallback) => Environment.GetEnvironmentVariable(name) is { Length: > 0 } value ? value : fallback;
        var defaults = new HsimahOptions();
        return new HsimahOptions
        {
            Endpoint = Get("HSIMAH_COSMOS_ENDPOINT", defaults.Endpoint),
            Key = Get("HSIMAH_COSMOS_KEY", defaults.Key),
            Database = Get("HSIMAH_COSMOS_DATABASE", defaults.Database),
            Container = Get("HSIMAH_COSMOS_CONTAINER", defaults.Container),
            AuthContainer = Get("HSIMAH_COSMOS_AUTH_CONTAINER", defaults.AuthContainer),
            AllowAnyCertificate = Get("HSIMAH_COSMOS_ALLOW_ANY_CERTIFICATE", "false") == "true",
            MediaDirectory = Get("HSIMAH_MEDIA", defaults.MediaDirectory),
            ClientDirectory = Get("HSIMAH_CLIENT", defaults.ClientDirectory),
            RouteManifest = Get("HSIMAH_ROUTES", defaults.RouteManifest),
            ContentFile = Get("HSIMAH_CONTENT", defaults.ContentFile),
        };
    }
}
