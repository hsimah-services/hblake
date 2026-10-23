using System.Text.Json;
using System.Text.RegularExpressions;

namespace Hsimah.Acceptance.Http;

// Session authentication over HTTP (architecture.md, acceptance 8). The endpoint contract is in tests/README.md. This file makes
// exactly two failed login attempts; the rate limit must tolerate at least five (the ops stage covers the limit itself).
public class AuthTests
{
    [Fact]
    public async Task A_successful_login_returns_the_viewer_and_sets_a_hardened_session_cookie()
    {
        await using var api = await Api.Anonymous();
        var response = await api.Login(Env.Username, Env.Password);
        Assert.Equal(200, response.Status);
        var viewer = (await response.JsonAsync())!.Value.GetProperty("viewer");
        Assert.Equal(Env.DisplayName, viewer.GetProperty("displayName").GetString());
        Assert.Equal("ADMIN", viewer.GetProperty("role").GetString());
        Assert.Matches("no-store", response.Headers.GetValueOrDefault("cache-control") ?? "");

        var session = Api.SetCookies(response).Where(cookie => cookie.Attributes.ContainsKey("httponly")).ToList();
        Assert.True(session.Count > 0, "login sets at least one HttpOnly cookie");
        foreach (var cookie in session)
        {
            Assert.Matches("^(lax|strict)$", (cookie.Attributes.GetValueOrDefault("samesite") ?? "").ToLowerInvariant());
            Assert.Equal("/", cookie.Attributes.GetValueOrDefault("path"));
            if (Env.BaseUrl.StartsWith("https:", StringComparison.Ordinal))
            {
                Assert.True(cookie.Attributes.ContainsKey("secure"), $"{cookie.Name} Secure");
            }
        }

        Assert.Equal("ADMIN", (await api.Viewer())!["role"]!.GetValue<string>());
    }

    [Fact]
    public async Task Failed_logins_are_generic_and_do_not_reveal_whether_the_account_exists()
    {
        await using var api = await Api.Anonymous();
        var wrongPassword = await api.Login(Env.Username, $"{Env.Password}-wrong");
        var unknownAccount = await api.Login($"nobody-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}", Env.Password);
        Assert.Equal(401, wrongPassword.Status);
        Assert.Equal(401, unknownAccount.Status);
        Assert.Equal(await wrongPassword.TextAsync(), await unknownAccount.TextAsync());
        Assert.Null(await api.Viewer());
    }

    [Fact]
    public async Task Login_requires_the_CSRF_token()
    {
        await using var api = await Api.Anonymous();
        var response = await api.Login(Env.Username, Env.Password, csrfHeader: false);
        Assert.Equal(403, response.Status);
        Assert.Null(await api.Viewer());
    }

    [Fact]
    public async Task Mutations_require_the_CSRF_token_and_apply_nothing_without_it()
    {
        await using var api = await Api.Operator();
        foreach (var wrong in new bool[] { false, true })
        {
            var input = Contents.Defaults(Kind.Page);
            var refused = await api.GraphQL(
                "mutation Create($input: CreatePageInput!) { createPage(input: $input) { page { id } } }",
                new { input },
                csrfHeader: false,
                csrfValue: wrong ? "not-the-token" : null);
            Assert.True(refused.Status == 403, $"CSRF {(wrong ? "wrong" : "missing")}");
            Assert.Null(await Contents.BySlug(api, Kind.Page, (string)input["slug"]!));
        }
    }

    [Fact]
    public async Task Queries_do_not_need_a_CSRF_token()
    {
        await using var api = await Api.Anonymous();
        var result = await api.GraphQL("query { pageItems(first: 1) { totalCount } }");
        Assert.Equal(200, result.Status);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public async Task Login_rotates_the_session_pre_login_cookies_are_not_authenticated()
    {
        await using var api = await Api.Anonymous();
        await api.CsrfToken(true);
        var before = await api.StorageState();
        var response = await api.Login(Env.Username, Env.Password);
        Assert.Equal(200, response.Status);
        var after = await api.StorageState();

        foreach (var cookie in Cookies(before).Where(cookie => cookie.GetProperty("httpOnly").GetBoolean()))
        {
            var name = cookie.GetProperty("name").GetString();
            var rotated = Cookies(after).FirstOrDefault(c => c.GetProperty("name").GetString() == name);
            if (rotated.ValueKind == JsonValueKind.Object)
            {
                Assert.NotEqual(cookie.GetProperty("value").GetString(), rotated.GetProperty("value").GetString());
            }
        }

        await using var replay = await Api.Anonymous(before);
        Assert.Null(await replay.Viewer());
    }

    [Fact]
    public async Task Logout_revokes_the_session_server_side()
    {
        await using var api = await Api.Operator();
        var signedIn = await api.StorageState();
        var response = await api.Logout();
        Assert.True(response.Status < 300);
        Assert.Null(await api.Viewer());

        await using var replay = await Api.Anonymous(signedIn);
        Assert.Null(await replay.Viewer());
        var input = Contents.Defaults(Kind.Page);
        Api.ExpectRejected(await Contents.Create(replay, Kind.Page, input), "mutation with a revoked session");

        await using var check = await Api.Operator();
        Assert.Null(await Contents.BySlug(check, Kind.Page, (string)input["slug"]!));
    }

    [Fact]
    public async Task Logout_requires_the_CSRF_token()
    {
        await using var api = await Api.Operator();
        var response = await api.Logout(csrfHeader: false);
        Assert.Equal(403, response.Status);
        Assert.Equal("ADMIN", (await api.Viewer())!["role"]!.GetValue<string>());
    }

    [Fact]
    public async Task Authenticated_responses_are_never_cacheable_by_shared_caches()
    {
        await using var api = await Api.Operator();
        var result = await api.GraphQL("query { viewer { id } pages(first: 1) { nodes { id status } } }");
        Assert.Matches("no-store|private", result.Headers.GetValueOrDefault("cache-control") ?? "");
        var csrf = await api.Context.GetAsync("/auth/csrf");
        Assert.Matches("no-store", csrf.Headers.GetValueOrDefault("cache-control") ?? "");
    }

    // Sessions are created only when needed.

    [Fact]
    public async Task Anonymous_reads_do_not_create_a_session()
    {
        // Crawlers and first-time visitors must not each leave a session row behind.
        await using var api = await Api.Anonymous();
        var query = await api.Context.PostAsync("/graphql", new() { DataObject = new { query = "{ pageItems(first: 1) { totalCount } }" } });
        Assert.Equal(200, query.Status);
        Assert.Empty(Api.SetCookies(query).Select(cookie => cookie.Name));
        foreach (var path in new[] { "/", "/pages/news", "/admin/login" })
        {
            var response = await api.Context.GetAsync(path);
            Assert.True(Api.SetCookies(response).Count == 0, $"Set-Cookie on GET {path}");
        }
    }

    [Fact]
    public async Task A_cookieless_mutation_is_refused_without_creating_a_session()
    {
        await using var api = await Api.Anonymous();
        var input = Contents.Defaults(Kind.Article);
        var response = await api.Context.PostAsync("/graphql", new()
        {
            DataObject = new { query = "mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id } } }", variables = new { input } },
            Headers = new Dictionary<string, string> { ["X-CSRF-Token"] = "not-a-token" },
        });
        Assert.Equal(403, response.Status);
        Assert.Empty(Api.SetCookies(response));
    }

    // Session cookies are Secure outside loopback HTTP. tests/README.md: cookies omit Secure only for plain-HTTP requests to a
    // loopback host, so a deployment behind a TLS proxy is safe without extra configuration. The Host header stands in for a
    // public hostname that reached the app over a proxy.
    private static readonly Dictionary<string, string> PublicHost = new() { ["Host"] = "www.example.test" };

    [Fact]
    public async Task The_anonymous_CSRF_session_cookie_is_Secure_for_a_public_host()
    {
        await using var api = await Api.Anonymous();
        var response = await api.Context.GetAsync("/auth/csrf", new() { Headers = PublicHost });
        Assert.Equal(200, response.Status);
        var cookies = Api.SetCookies(response);
        Assert.True(cookies.Count > 0, "GET /auth/csrf starts a session");
        foreach (var cookie in cookies)
        {
            Assert.True(cookie.Attributes.ContainsKey("secure"), $"{cookie.Name} Secure");
        }
    }

    [Fact]
    public async Task The_signed_in_session_cookie_is_Secure_for_a_public_host()
    {
        await using var api = await Api.Anonymous();
        var token = await api.CsrfToken();
        var headers = new Dictionary<string, string>(PublicHost) { ["X-CSRF-Token"] = token };
        var response = await api.Context.PostAsync("/auth/login", new() { DataObject = new { username = Env.Username, password = Env.Password }, Headers = headers });
        Assert.True(response.Status == 200, await response.TextAsync());
        var session = Api.SetCookies(response).Where(cookie => cookie.Attributes.ContainsKey("httponly")).ToList();
        Assert.NotEmpty(session);
        foreach (var cookie in session)
        {
            Assert.True(cookie.Attributes.ContainsKey("secure"), $"{cookie.Name} Secure");
        }
    }

    private static List<JsonElement> Cookies(string storageState) =>
        JsonDocument.Parse(storageState).RootElement.GetProperty("cookies").EnumerateArray().Select(cookie => cookie.Clone()).ToList();
}
