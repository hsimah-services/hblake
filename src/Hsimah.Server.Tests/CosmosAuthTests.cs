namespace Hsimah.Tests;

public class CosmosAuthTests
{
    private static HsimahOptions Options(string endpoint, string? key = null, bool emulatorCertificate = false) =>
        new() { Endpoint = endpoint, Key = key, AllowAnyCertificate = emulatorCertificate };

    [Fact]
    public void An_explicit_key_is_used_whatever_the_endpoint()
    {
        Assert.Equal(CosmosSignIn.Key, CosmosAuth.Choose(Options("https://account.documents.azure.com:443/", "secret")));
        Assert.Equal(CosmosSignIn.Key, CosmosAuth.Choose(Options("https://localhost:8081", "secret")));
    }

    [Fact]
    public void The_emulator_needs_no_key()
    {
        Assert.Equal(CosmosSignIn.Emulator, CosmosAuth.Choose(Options("https://localhost:8081")));
        Assert.Equal(CosmosSignIn.Emulator, CosmosAuth.Choose(Options("https://127.0.0.1:8081")));
        Assert.Equal(CosmosSignIn.Emulator, CosmosAuth.Choose(Options("https://hblake-acceptance-cosmos:8081", emulatorCertificate: true)));
    }

    [Fact]
    public void A_real_account_with_no_key_signs_in_as_the_application()
    {
        Assert.Equal(CosmosSignIn.Identity, CosmosAuth.Choose(Options("https://account.documents.azure.com:443/")));
    }

    [Fact]
    public void Identity_sign_in_builds_a_client_without_any_secret()
    {
        using var client = CosmosAuth.CreateClient(Options("https://account.documents.azure.com:443/"), new Azure.Identity.DefaultAzureCredential());
        Assert.Equal("https://account.documents.azure.com/", client.Endpoint.ToString());
    }
}
