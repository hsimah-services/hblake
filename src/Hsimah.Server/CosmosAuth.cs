using Azure.Core;
using Azure.Identity;
using Elephentity.Cosmos;
using Microsoft.Azure.Cosmos;

namespace Hsimah;

/// <summary>How the server signs in to Cosmos DB.</summary>
public enum CosmosSignIn
{
    /// <summary>The account key in <c>HSIMAH_COSMOS_KEY</c>.</summary>
    Key,

    /// <summary>The emulator's published key: an emulator is recognised by its self-signed certificate setting or a loopback endpoint.</summary>
    Emulator,

    /// <summary>The application's identity (managed identity in Azure, <c>az login</c> or environment credentials elsewhere). No secret is stored.</summary>
    Identity,
}

public static class CosmosAuth
{
    /// <summary>Chooses the sign-in: an explicit key wins, then the emulator, otherwise identity.</summary>
    public static CosmosSignIn Choose(HsimahOptions options)
    {
        if (options.Key is not null)
        {
            return CosmosSignIn.Key;
        }

        var loopback = Uri.TryCreate(options.Endpoint, UriKind.Absolute, out var endpoint) && (endpoint.IsLoopback || endpoint.Host == "host.containers.internal");
        return options.AllowAnyCertificate || loopback ? CosmosSignIn.Emulator : CosmosSignIn.Identity;
    }

    public static CosmosClient CreateClient(HsimahOptions options, TokenCredential? credential = null)
    {
        var settings = new CosmosClientSettings(AllowAnyServerCertificate: options.AllowAnyCertificate);
        return Choose(options) switch
        {
            CosmosSignIn.Key => settings.CreateClient(options.Endpoint, options.Key!),
            CosmosSignIn.Emulator => settings.CreateClient(options.Endpoint, HsimahOptions.EmulatorKey),
            _ => settings.CreateClient(options.Endpoint, credential ?? new DefaultAzureCredential()),
        };
    }
}
