using Microsoft.AspNetCore.HttpOverrides;

namespace Hsimah;

/// <summary>
/// Behind a TLS-terminating proxy the connection's address is the proxy's, so every visitor would share one login-throttle bucket and the
/// request would look like plain HTTP. With <c>HSIMAH_TRUST_PROXY=true</c> the forwarded headers of exactly one proxy hop are applied.
/// </summary>
public static class ProxyHeaders
{
    public static ForwardedHeadersOptions Options()
    {
        var options = new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost,
            // One hop: the last address in X-Forwarded-For is the one the platform proxy saw, and a client cannot add itself after it.
            ForwardLimit = 1,
        };

        // The platform proxy's address is not fixed, and the container accepts connections only from it, so any sender is that proxy.
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();
        return options;
    }
}
