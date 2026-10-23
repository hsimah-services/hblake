using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit.Sdk;
using Xunit.v3;

[assembly: System.Runtime.Versioning.UnsupportedOSPlatform("windows")]
[assembly: TestMethodOrderer(typeof(Hsimah.Acceptance.Ops.ByName))]

namespace Hsimah.Acceptance.Ops;

/// <summary>Runs the tests in name order: the rate limit is last because it may block further logins.</summary>
public sealed class ByName : ITestMethodOrderer
{
    public IReadOnlyCollection<TTestMethod?> OrderTestMethods<TTestMethod>(IReadOnlyCollection<TTestMethod?> testMethods)
        where TTestMethod : ITestMethod =>
        testMethods.OrderBy(method => method?.MethodName, StringComparer.Ordinal).ToList();
}

/// <summary>One cookie jar: GET /auth/csrf, POST /auth/login|logout and POST /graphql.</summary>
public sealed class Client : IDisposable
{
    private readonly HttpClient http;
    private string? token;

    public Client() => http = new HttpClient(new HttpClientHandler { CookieContainer = new CookieContainer(), AllowAutoRedirect = false }) { Timeout = TimeSpan.FromSeconds(30) };

    public static string BaseUrl { get; } = (Environment.GetEnvironmentVariable("BASE_URL") ?? "http://localhost:8080").TrimEnd('/');

    public static string Username { get; } = Environment.GetEnvironmentVariable("ADMIN_USERNAME") ?? string.Empty;

    public static string Password { get; } = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? string.Empty;

    public async Task<(int Status, string Body)> Request(HttpMethod method, string path, HttpContent? content = null, Dictionary<string, string>? headers = null)
    {
        using var request = new HttpRequestMessage(method, BaseUrl + path) { Content = content };
        foreach (var (key, value) in headers ?? [])
        {
            request.Headers.Add(key, value);
        }

        using var response = await http.SendAsync(request);
        return ((int)response.StatusCode, await response.Content.ReadAsStringAsync());
    }

    private static StringContent Json(object body) => new(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

    public async Task<string> Csrf()
    {
        var (status, body) = await Request(HttpMethod.Get, "/auth/csrf");
        Assert.True(status == 200, $"GET /auth/csrf returned {status}: {body}");
        token = JsonNode.Parse(body)!["token"]!.GetValue<string>();
        return token;
    }

    public async Task<int> Login(string? username = null, string? password = null)
    {
        var (status, _) = await Request(HttpMethod.Post, "/auth/login", Json(new { username = username ?? Username, password = password ?? Password }), new() { ["X-CSRF-Token"] = await Csrf() });
        token = null;
        return status;
    }

    public async Task<JsonNode> GraphQL(string query, object? variables = null)
    {
        var headers = new Dictionary<string, string>();
        if (query.TrimStart().StartsWith("mutation", StringComparison.Ordinal))
        {
            headers["X-CSRF-Token"] = token ?? await Csrf();
        }

        var (status, body) = await Request(HttpMethod.Post, "/graphql", Json(new { query, variables = variables ?? new { } }), headers);
        JsonNode payload;
        try
        {
            payload = JsonNode.Parse(body) ?? new JsonObject();
        }
        catch (JsonException)
        {
            payload = new JsonObject();
        }

        payload["_status"] = status;
        return payload;
    }

    public async Task<JsonNode?> Viewer() => (await GraphQL("query { viewer { id displayName role } }"))["data"]?["viewer"];

    public Task<JsonNode> CreatePage(string slug, string title) =>
        GraphQL("mutation($input: CreatePageInput!) { createPage(input: $input) { page { id slug status } } }", new { input = new { title, slug, content = $"Body of {title}." } });

    /// <summary>POST /media as multipart field `image`; returns the stored URL.</summary>
    public async Task<string> Upload(byte[] image)
    {
        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(image);
        file.Headers.ContentType = new("image/png");
        form.Add(file, "image", "square.png");
        var (status, body) = await Request(HttpMethod.Post, "/media", form, new() { ["X-CSRF-Token"] = await Csrf() });
        Assert.Equal(201, status);
        return JsonNode.Parse(body)!["url"]!.GetValue<string>();
    }

    public async Task<int> Fetch(string path) => (await Request(HttpMethod.Get, path)).Status;

    public async Task<JsonNode?> Page(string slug) =>
        (await GraphQL("query($slug: String!) { pageBySlug(slug: $slug) { id slug title status } }", new { slug }))["data"]?["pageBySlug"];

    public void Dispose() => http.Dispose();

    public static bool Rejected(JsonNode result) => result["_status"]!.GetValue<int>() >= 400 || result["errors"] is JsonArray { Count: > 0 };

    public static async Task<Client> Operator()
    {
        var client = new Client();
        var status = await client.Login();
        Assert.True(status == 200, $"operator login returned {status}");
        return client;
    }
}

/// <summary>
/// Operator procedures and destructive checks, run on the host after the Playwright suite. These need the harness scripts in
/// scripts/acceptance/ (see tests/README.md) and change global state: they lock the operator out, expire sessions and trip the
/// login rate limit. Tests run in name order; the rate limit is last because it may block further logins.
/// </summary>
public class OperatorProcedures
{
    private static readonly string Root = FindRoot();
    private static readonly string Run = Guid.NewGuid().ToString("N")[..8];

    // A 4×4 PNG for POST /media.
    private static readonly byte[] Png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAADElEQVQImWNgIB0AAAA0AAEjQ4N1AAAAAElFTkSuQmCC");

    private static string FindRoot()
    {
        var configured = Environment.GetEnvironmentVariable("REPO_ROOT");
        if (!string.IsNullOrEmpty(configured))
        {
            return configured;
        }

        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, "eleph.json")))
            {
                return directory.FullName;
            }
        }

        throw new InvalidOperationException("Set REPO_ROOT to the repository root.");
    }

    private sealed record Harness(int ExitCode, string Output);

    private static async Task<Harness> RunHarness(string name, string[] args, Dictionary<string, string>? env = null)
    {
        var path = Path.Combine(Root, "scripts", "acceptance", name);
        Assert.True(File.Exists(path) && (File.GetUnixFileMode(path) & UnixFileMode.UserExecute) != 0, $"missing harness script scripts/acceptance/{name}");
        var info = new ProcessStartInfo(path) { WorkingDirectory = Root, RedirectStandardOutput = true, RedirectStandardError = true };
        foreach (var arg in args)
        {
            info.ArgumentList.Add(arg);
        }

        foreach (var (key, value) in env ?? [])
        {
            info.Environment[key] = value;
        }

        using var process = Process.Start(info)!;
        var output = process.StandardOutput.ReadToEndAsync();
        var error = process.StandardError.ReadToEndAsync();
        using var timeout = new CancellationTokenSource(TimeSpan.FromMinutes(10));
        await process.WaitForExitAsync(timeout.Token);
        return new Harness(process.ExitCode, await output + await error);
    }

    [Fact]
    public async Task T10_bootstrap_refuses_a_second_account()
    {
        Assert.False(string.IsNullOrEmpty(Client.Username) || string.IsNullOrEmpty(Client.Password), "ADMIN_USERNAME and ADMIN_PASSWORD must be set; run tests/run.sh");
        var other = $"second-{Run}";
        var result = await RunHarness("bootstrap", [], new() { ["ADMIN_USERNAME"] = other, ["ADMIN_PASSWORD"] = "second-account-password", ["ADMIN_DISPLAY_NAME"] = "Second" });
        Assert.True(result.ExitCode != 0, $"bootstrap must refuse when an account exists:\n{result.Output}");
        using (var second = new Client())
        {
            Assert.Equal(401, await second.Login(other, "second-account-password"));
        }

        using var original = new Client();
        Assert.True(await original.Login() == 200, "the original operator still signs in");
    }

    [Fact]
    public async Task T20_installer_refuses_a_populated_database()
    {
        using var client = await Client.Operator();
        var slug = $"install-guard-{Run}";
        Assert.False(Client.Rejected(await client.CreatePage(slug, "Install guard")));
        var result = await RunHarness("install", []);
        Assert.True(result.ExitCode != 0, $"the initial installer must refuse a populated database:\n{result.Output}");
        using var again = await Client.Operator();
        Assert.NotNull(await again.Page(slug));
    }

    [Fact]
    public async Task T30_backup_and_restore_round_trip()
    {
        using var client = await Client.Operator();
        var slug = $"backup-{Run}";
        var created = await client.CreatePage(slug, "Backed up");
        Assert.False(Client.Rejected(created), created.ToJsonString());
        var pageId = created["data"]!["createPage"]!["page"]!["id"]!.GetValue<string>();
        var kept = await client.Upload(Png);

        var directory = Directory.CreateTempSubdirectory("hsimah-ops-");
        try
        {
            var backup = Path.Combine(directory.FullName, "backup");
            var made = await RunHarness("backup", [backup]);
            Assert.True(made.ExitCode == 0, made.Output);
            Assert.True(File.Exists(backup), "backup wrote the requested path");

            var deleted = await client.GraphQL("mutation($input: DeletePageInput!) { deletePage(input: $input) { deletedId } }", new { input = new { id = pageId } });
            Assert.False(Client.Rejected(deleted), deleted.ToJsonString());
            Assert.Null(await client.Page(slug));
            var later = await client.Upload(Png);

            var restored = await RunHarness("restore", [backup]);
            Assert.True(restored.ExitCode == 0, restored.Output);

            using var after = await Client.Operator();
            var page = await after.Page(slug);
            Assert.True(page is not null, "restore brings back content deleted after the backup");
            Assert.Equal("Backed up", page!["title"]!.GetValue<string>());
            using var visitor = new Client();
            Assert.True(await visitor.Fetch(kept) == 200, "images uploaded before the backup are restored");
            Assert.True(await visitor.Fetch(later) == 404, "the restore replaces images with the backup's");
        }
        finally
        {
            directory.Delete(true);
        }
    }

    [Fact]
    public async Task T40_expired_sessions_cannot_use_the_api()
    {
        using var client = await Client.Operator();
        Assert.NotNull(await client.Viewer());
        var result = await RunHarness("expire-sessions", []);
        Assert.True(result.ExitCode == 0, result.Output);
        Assert.Null(await client.Viewer());
        Assert.True(Client.Rejected(await client.CreatePage($"expired-{Run}", "Expired")), "an expired session cannot write");
        using var again = await Client.Operator();
        Assert.Null(await again.Page($"expired-{Run}"));
    }

    [Fact]
    public async Task T50_an_inactive_operator_cannot_sign_in_or_act()
    {
        using var client = await Client.Operator();
        try
        {
            var result = await RunHarness("set-active", ["false"]);
            Assert.True(result.ExitCode == 0, result.Output);
            Assert.Null(await client.Viewer());
            Assert.True(Client.Rejected(await client.CreatePage($"inactive-{Run}", "Inactive")));
            using var wrongClient = new Client();
            var wrong = await wrongClient.Login(Client.Username, Client.Password + "-wrong");
            using var inactiveClient = new Client();
            var inactive = await inactiveClient.Login();
            Assert.True(inactive == 401, "inactive accounts get the generic login failure");
            Assert.Equal(inactive, wrong);
        }
        finally
        {
            var restored = await RunHarness("set-active", ["true"]);
            Assert.True(restored.ExitCode == 0, restored.Output);
        }

        using var again = await Client.Operator();
        Assert.Null(await again.Page($"inactive-{Run}"));
    }

    [Fact]
    public async Task T90_login_attempts_are_rate_limited()
    {
        using var client = new Client();
        var statuses = new List<int>();
        for (var i = 0; i < 30; i++)
        {
            statuses.Add(await client.Login($"limit-{Run}", "wrong-password"));
        }

        Assert.True(statuses.Contains(429), $"30 failed logins never returned 429: {string.Join(", ", statuses)}");
        var first = statuses.IndexOf(429);
        Assert.True(first > 0, "the first attempt of a fresh username is not already blocked");
        Assert.True(statuses.Take(first).All(status => status == 401), string.Join(", ", statuses));
    }
}
