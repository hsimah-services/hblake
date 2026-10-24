using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;

namespace Hsimah.Tests;

public class ProxyHeadersTests
{
    private static async Task<string> Seen(bool trust, string forwardedFor)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        await using var app = builder.Build();
        if (trust)
        {
            app.UseForwardedHeaders(ProxyHeaders.Options());
        }

        app.Run(http => http.Response.WriteAsync($"{http.Connection.RemoteIpAddress}|{http.Request.Scheme}|{http.Request.Host}"));
        await app.StartAsync();
        var client = app.GetTestClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/");
        request.Headers.Add("X-Forwarded-For", forwardedFor);
        request.Headers.Add("X-Forwarded-Proto", "https");
        request.Headers.Add("X-Forwarded-Host", "hbla.ke");
        return await (await client.SendAsync(request)).Content.ReadAsStringAsync();
    }

    [Fact]
    public async Task A_trusted_proxy_supplies_the_client_address_scheme_and_host()
    {
        Assert.Equal("203.0.113.9|https|hbla.ke", await Seen(true, "203.0.113.9"));
    }

    [Fact]
    public async Task Only_the_last_hop_counts_so_a_client_cannot_name_itself()
    {
        Assert.StartsWith("203.0.113.9|", await Seen(true, "198.51.100.1, 203.0.113.9"));
    }

    [Fact]
    public async Task Without_trust_the_headers_are_ignored()
    {
        var seen = await Seen(false, "203.0.113.9");
        Assert.DoesNotContain("203.0.113.9", seen);
        Assert.Contains("|http|", seen);
    }
}
