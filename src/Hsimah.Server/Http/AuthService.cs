using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using Elephentity.Runtime.Gateway;
using Elephentity.Runtime.Identity;
using Hsimah.Domain;
using Elephentity.Runtime.Storage;
using Hsimah.Entity;
using Microsoft.Azure.Cosmos;

namespace Hsimah.Http;

/// <summary>
/// Server sessions, credentials and login throttling. They live in their own Cosmos container so the content container's unique keys
/// never apply to them; sessions and failures expire through the container's item time-to-live.
/// </summary>
public sealed class AuthService(CosmosClient client, HsimahOptions options, Elephentity.Runtime.Gateway.Runtime runtime, UserHydrator users)
{
    public const string Cookie = "hsimah_session";
    public const int SessionSeconds = 28800;
    public const int FailureWindowSeconds = 900;
    public const int MaxFailures = 12;

    // A valid bcrypt hash of nothing in particular, verified for unknown accounts so timing does not reveal them.
    private const string DummyHash = "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi";
    private const string Partition = "auth";

    private Container Auth => client.GetContainer(options.Database, options.AuthContainer);

    public sealed record Session(string TokenHash, string? UserId, string Csrf, long ExpiresAt);

    /// <summary>The session named by the request's cookie, if it is still valid.</summary>
    public async Task<Session?> SessionOf(HttpContext http)
    {
        if (http.Items.TryGetValue(typeof(Session), out var cached))
        {
            return cached as Session;
        }

        Session? session = null;
        if (http.Request.Cookies.TryGetValue(Cookie, out var cookie) && cookie.Length == 64 && cookie.All(Uri.IsHexDigit) && cookie == cookie.ToLowerInvariant())
        {
            var node = await Read(Hash(cookie), http.RequestAborted).ConfigureAwait(false);
            if (node is not null && node["kind"]?.GetValue<string>() == "session" && node["expiresAt"]!.GetValue<long>() > Now())
            {
                session = new Session(node["id"]!.GetValue<string>(), node["userId"]?.GetValue<string>(), node["csrf"]!.GetValue<string>(), node["expiresAt"]!.GetValue<long>());
            }
        }

        http.Items[typeof(Session)] = session;
        return session;
    }

    /// <summary>The acting user: the session's account if it is still active, otherwise a visitor.</summary>
    public async Task<Actor> ActorOf(HttpContext http)
    {
        var session = await SessionOf(http).ConfigureAwait(false);
        if (session?.UserId is null)
        {
            return Actor.Visitor;
        }

        using var scope = RequestViewerProvider.Use(Actor.Operator);
        var user = await runtime.FindAsync("User", EntityId.Of(session.UserId), http.RequestAborted).ConfigureAwait(false) as User;
        return user is { Active: true } ? new Actor(user) : Actor.Visitor;
    }

    /// <summary>Starts an anonymous session on first use and returns the current session's token.</summary>
    public async Task<string> Csrf(HttpContext http)
    {
        var session = await SessionOf(http).ConfigureAwait(false) ?? await Rotate(http, null).ConfigureAwait(false);
        return session.Csrf;
    }

    public async Task<bool> CsrfValid(HttpContext http)
    {
        var session = await SessionOf(http).ConfigureAwait(false);
        var token = http.Request.Headers["X-CSRF-Token"].ToString();
        return session is not null && token.Length > 0
            && CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(session.Csrf), Encoding.UTF8.GetBytes(token));
    }

    public sealed record Outcome(int Status, object? Body, Actor? Viewer = null);

    public async Task<Outcome> Login(HttpContext http, string username, string password)
    {
        var address = AddressOf(http);
        if (await Throttled(address, http.RequestAborted).ConfigureAwait(false))
        {
            return new Outcome(429, new { error = "Try again later." });
        }

        username = username.Trim().ToLowerInvariant();
        User? user;
        string? hash = null;
        using (RequestViewerProvider.Use(Actor.Operator))
        {
            user = await runtime.Queries().Of(users, Criteria.For("User").Where(Filter.Equal("username", username))).FirstAsync(http.RequestAborted).ConfigureAwait(false);
        }

        if (user is not null)
        {
            var credential = await Read("cred-" + user.Id, http.RequestAborted).ConfigureAwait(false);
            hash = credential?["passwordHash"]?.GetValue<string>();
        }

        var valid = BCrypt.Net.BCrypt.Verify(password, hash ?? DummyHash);
        if (user is null || hash is null || !valid || !user.Active)
        {
            return await Fail(address, "Invalid username or password.", http.RequestAborted).ConfigureAwait(false);
        }

        await Auth.DeleteItemStreamAsync("fail-" + address, new PartitionKey(Partition), cancellationToken: http.RequestAborted).ConfigureAwait(false);
        await Rotate(http, user.Id.ToString()).ConfigureAwait(false);
        return new Outcome(200, null, new Actor(user));
    }

    public async Task<Outcome> ChangePassword(HttpContext http, Actor actor, string current, string next)
    {
        if (actor.User is null)
        {
            return new Outcome(401, new { error = "Sign in to change the password." });
        }

        var address = AddressOf(http);
        if (await Throttled(address, http.RequestAborted).ConfigureAwait(false))
        {
            return new Outcome(429, new { error = "Try again later." });
        }

        var id = actor.User.Id.ToString();
        var credential = await Read("cred-" + id, http.RequestAborted).ConfigureAwait(false);
        var hash = credential?["passwordHash"]?.GetValue<string>();
        if (hash is null || !BCrypt.Net.BCrypt.Verify(current, hash))
        {
            return await Fail(address, "The current password is incorrect.", http.RequestAborted).ConfigureAwait(false);
        }

        if (!Rules.Password(next).IsOk)
        {
            return new Outcome(400, new { error = "Use a password of at least 12 characters." });
        }

        await SetPassword(id, next, http.RequestAborted).ConfigureAwait(false);
        var keep = (await SessionOf(http).ConfigureAwait(false))?.TokenHash;
        await RevokeSessions(id, keep, http.RequestAborted).ConfigureAwait(false);
        return new Outcome(200, new { ok = true });
    }

    public async Task Logout(HttpContext http) => await Rotate(http, null).ConfigureAwait(false);

    public async Task SetPassword(string userId, string password, CancellationToken token)
    {
        var node = new JsonObject
        {
            ["id"] = "cred-" + userId,
            ["pk"] = Partition,
            ["kind"] = "credential",
            ["userId"] = userId,
            ["passwordHash"] = BCrypt.Net.BCrypt.HashPassword(password, 10),
        };
        await Auth.UpsertItemAsync(node, new PartitionKey(Partition), cancellationToken: token).ConfigureAwait(false);
    }

    public async Task RevokeSessions(string userId, string? except, CancellationToken token)
    {
        var query = new QueryDefinition("SELECT c.id FROM c WHERE c.kind = 'session' AND c.userId = @user").WithParameter("@user", userId);
        using var iterator = Auth.GetItemQueryIterator<JsonObject>(query, requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(Partition) });
        while (iterator.HasMoreResults)
        {
            foreach (var row in await iterator.ReadNextAsync(token).ConfigureAwait(false))
            {
                var id = row["id"]!.GetValue<string>();
                if (id != except)
                {
                    await Auth.DeleteItemStreamAsync(id, new PartitionKey(Partition), cancellationToken: token).ConfigureAwait(false);
                }
            }
        }
    }

    /// <summary>Test hook: every session expires as though its lifetime had passed.</summary>
    public async Task ExpireAll(CancellationToken token)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.kind = 'session'");
        using var iterator = Auth.GetItemQueryIterator<JsonObject>(query, requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(Partition) });
        while (iterator.HasMoreResults)
        {
            foreach (var row in await iterator.ReadNextAsync(token).ConfigureAwait(false))
            {
                row["expiresAt"] = 0;
                await Auth.ReplaceItemAsync(row, row["id"]!.GetValue<string>(), new PartitionKey(Partition), cancellationToken: token).ConfigureAwait(false);
            }
        }
    }

    private async Task<Outcome> Fail(string address, string message, CancellationToken token)
    {
        var now = Now();
        var existing = await Read("fail-" + address, token).ConfigureAwait(false);
        var fresh = existing is not null && existing["startedAt"]!.GetValue<long>() >= now - FailureWindowSeconds;
        var node = new JsonObject
        {
            ["id"] = "fail-" + address,
            ["pk"] = Partition,
            ["kind"] = "failure",
            ["attempts"] = fresh ? existing!["attempts"]!.GetValue<int>() + 1 : 1,
            ["startedAt"] = fresh ? existing!["startedAt"]!.GetValue<long>() : now,
            ["ttl"] = FailureWindowSeconds,
        };
        await Auth.UpsertItemAsync(node, new PartitionKey(Partition), cancellationToken: token).ConfigureAwait(false);
        return new Outcome(401, new { error = message });
    }

    private static string AddressOf(HttpContext http) =>
        http.Connection.RemoteIpAddress is { } ip ? (ip.IsIPv4MappedToIPv6 ? ip.MapToIPv4() : ip).ToString() : "local";

    /// <summary>Whether this address already has too many recent failures.</summary>
    private async Task<bool> Throttled(string address, CancellationToken token)
    {
        var fail = await Read("fail-" + address, token).ConfigureAwait(false);
        return fail is not null && fail["startedAt"]!.GetValue<long>() > Now() - FailureWindowSeconds && fail["attempts"]!.GetValue<int>() >= MaxFailures;
    }

    private async Task<Session> Rotate(HttpContext http, string? userId)
    {
        var current = await SessionOf(http).ConfigureAwait(false);
        if (current is not null)
        {
            await Auth.DeleteItemStreamAsync(current.TokenHash, new PartitionKey(Partition), cancellationToken: http.RequestAborted).ConfigureAwait(false);
        }

        var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var session = new Session(Hash(raw), userId, Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant(), Now() + SessionSeconds);
        var node = new JsonObject
        {
            ["id"] = session.TokenHash,
            ["pk"] = Partition,
            ["kind"] = "session",
            ["userId"] = userId,
            ["csrf"] = session.Csrf,
            ["expiresAt"] = session.ExpiresAt,
            ["ttl"] = SessionSeconds,
        };
        await Auth.CreateItemAsync(node, new PartitionKey(Partition), cancellationToken: http.RequestAborted).ConfigureAwait(false);
        http.Items[typeof(Session)] = session;
        http.Response.Cookies.Append(Cookie, raw, new CookieOptions
        {
            Expires = DateTimeOffset.UtcNow.AddSeconds(SessionSeconds),
            MaxAge = TimeSpan.FromSeconds(SessionSeconds),
            Path = "/",
            Secure = SecureCookie(http),
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
        });
        return session;
    }

    /// <summary>Secure for HTTPS and every public host; plain HTTP to a loopback host is the only exception.</summary>
    public static bool SecureCookie(HttpContext http) =>
        http.Request.IsHttps || !(http.Request.Host.Host is "localhost" or "127.0.0.1" or "[::1]" or "::1");

    private async Task<JsonObject?> Read(string id, CancellationToken token)
    {
        try
        {
            return (await Auth.ReadItemAsync<JsonObject>(id, new PartitionKey(Partition), cancellationToken: token).ConfigureAwait(false)).Resource;
        }
        catch (CosmosException error) when (error.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    private static string Hash(string raw) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();

    private static long Now() => DateTimeOffset.UtcNow.ToUnixTimeSeconds();
}
