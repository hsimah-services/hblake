using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.Playwright;

namespace Hsimah.Acceptance.Lib;

public sealed record GraphQLResult(int Status, IReadOnlyDictionary<string, string> Headers, string Body, JsonNode? Data, JsonArray Errors)
{
    /// <summary>The value under one or more keys of the data, or null.</summary>
    public JsonNode? this[string key] => Data?[key];
}

/// <summary>A Set-Cookie header, parsed into its name, value and lowercased attributes.</summary>
public sealed record SetCookie(string Name, string Value, IReadOnlyDictionary<string, string> Attributes);

/// <summary>
/// One HTTP client with its own cookie jar: an anonymous visitor or a signed-in operator.
/// Contract (tests/README.md): GET /auth/csrf returns { token }; every POST that changes state sends it as X-CSRF-Token.
/// </summary>
public sealed class Api : IAsyncDisposable
{
    private string? csrf;

    private Api(IAPIRequestContext context) => Context = context;

    public IAPIRequestContext Context { get; }

    public static async Task<Api> Anonymous(string? storageState = null)
    {
        var playwright = await Browsers.PlaywrightAsync();
        return new Api(await playwright.APIRequest.NewContextAsync(new APIRequestNewContextOptions { BaseURL = Env.BaseUrl, StorageState = storageState }));
    }

    public static async Task<Api> Operator()
    {
        var api = await Anonymous();
        var response = await api.Login(Env.Username, Env.Password);
        Assert.True(response.Status == 200, $"operator login failed: {await response.TextAsync()}");
        return api;
    }

    public async Task<string> CsrfToken(bool refresh = false)
    {
        if (csrf is null || refresh)
        {
            var response = await Context.GetAsync("/auth/csrf");
            Assert.True(response.Status == 200, "GET /auth/csrf");
            var token = (await response.JsonAsync())?.GetProperty("token");
            Assert.True(token?.ValueKind == JsonValueKind.String, "GET /auth/csrf returns { token: string }");
            csrf = token!.Value.GetString();
        }

        return csrf!;
    }

    public async Task<IAPIResponse> Login(string username, string password, bool csrfHeader = true)
    {
        var headers = new Dictionary<string, string>();
        if (csrfHeader)
        {
            headers["X-CSRF-Token"] = await CsrfToken(true);
        }

        var response = await Context.PostAsync("/auth/login", new APIRequestContextOptions { DataObject = new { username, password }, Headers = headers });
        // The token may rotate with the session; fetch a fresh one for the next write.
        csrf = null;
        return response;
    }

    /// <summary>POST /auth/password for the signed-in account; sends the CSRF token unless <paramref name="csrfHeader" /> is false.</summary>
    public async Task<IAPIResponse> ChangePassword(string currentPassword, string newPassword, bool csrfHeader = true)
    {
        var headers = new Dictionary<string, string>();
        if (csrfHeader)
        {
            headers["X-CSRF-Token"] = await CsrfToken(true);
        }

        return await Context.PostAsync("/auth/password", new APIRequestContextOptions { DataObject = new { currentPassword, newPassword }, Headers = headers });
    }

    public async Task<IAPIResponse> Logout(bool csrfHeader = true)
    {
        var headers = new Dictionary<string, string>();
        if (csrfHeader)
        {
            headers["X-CSRF-Token"] = await CsrfToken(true);
        }

        var response = await Context.PostAsync("/auth/logout", new APIRequestContextOptions { Headers = headers });
        csrf = null;
        return response;
    }

    /// <summary>
    /// POST /graphql. Mutations carry the CSRF token unless <paramref name="csrfHeader" /> is false (omit it) or
    /// <paramref name="csrfValue" /> is given (send that value instead).
    /// </summary>
    public async Task<GraphQLResult> GraphQL(string query, object? variables = null, bool csrfHeader = true, string? csrfValue = null)
    {
        var headers = new Dictionary<string, string> { ["content-type"] = "application/json" };
        var isMutation = Regex.IsMatch(query, @"^\s*mutation\b");
        if (csrfValue is not null)
        {
            headers["X-CSRF-Token"] = csrfValue;
        }
        else if (csrfHeader && isMutation)
        {
            headers["X-CSRF-Token"] = await CsrfToken();
        }

        var response = await Context.PostAsync("/graphql", new APIRequestContextOptions
        {
            DataObject = new { query, variables = variables ?? new { } },
            Headers = headers,
        });
        var body = await response.TextAsync();
        JsonNode? json = null;
        try
        {
            json = JsonNode.Parse(body);
        }
        catch (JsonException)
        {
        }

        return new GraphQLResult(response.Status, response.Headers, body, json?["data"], json?["errors"] as JsonArray ?? []);
    }

    /// <summary>A GraphQL operation that must succeed; returns its data.</summary>
    public async Task<JsonNode> Ok(string query, object? variables = null)
    {
        var result = await GraphQL(query, variables);
        var first = query.Trim().Split('\n')[0];
        Assert.True(result.Status == 200, $"HTTP status for {first}: {result.Body}");
        Assert.True(result.Errors.Count == 0, $"GraphQL errors for {first}: {result.Body}");
        Assert.NotNull(result.Data);
        return result.Data!;
    }

    public async Task<JsonNode?> Viewer()
    {
        var result = await GraphQL("query Viewer { viewer { id displayName role } }");
        Assert.Equal(200, result.Status);
        return result.Data?["viewer"];
    }

    public Task<string> StorageState() => Context.StorageStateAsync();

    public async ValueTask DisposeAsync() => await Context.DisposeAsync();

    /// <summary>The server refused the operation: an HTTP error status, or GraphQL errors.</summary>
    public static void ExpectRejected(GraphQLResult result, string? message = null)
    {
        var rejected = result.Status >= 400 || result.Errors.Count > 0;
        Assert.True(rejected, $"{message ?? "expected the server to reject the operation"}; got {result.Status} {Trim(result.Body, 500)}");
    }

    /// <summary>Every Set-Cookie header on a response.</summary>
    public static List<SetCookie> SetCookies(IAPIResponse response) =>
        response.HeadersArray
            .Where(header => header.Name.Equals("set-cookie", StringComparison.OrdinalIgnoreCase))
            .Select(header =>
            {
                var parts = header.Value.Split(';');
                var pair = parts[0];
                var index = pair.IndexOf('=', StringComparison.Ordinal);
                var attributes = new Dictionary<string, string>();
                foreach (var part in parts.Skip(1))
                {
                    var keyValue = part.Trim().Split('=', 2);
                    attributes[keyValue[0].ToLowerInvariant()] = keyValue.Length > 1 ? keyValue[1] : string.Empty;
                }

                return new SetCookie(pair[..index].Trim(), pair[(index + 1)..].Trim(), attributes);
            })
            .ToList();

    public static string Trim(string text, int length) => text.Length <= length ? text : text[..length];
}
