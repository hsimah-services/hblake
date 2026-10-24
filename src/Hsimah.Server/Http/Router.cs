using System.Net.Mime;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Hsimah;
using Elephentity.Tsquid;
using GraphQL;
using GraphQL.Transport;
using GraphQLParser;
using GraphQLParser.AST;
using Hsimah.Assets;
using Hsimah.Domain;

namespace Hsimah.Http;

/// <summary>
/// Every request the site answers, in the order it decides them: the Atom feed, images, GraphQL and authentication, the built
/// client's files, and finally the client shell with the route's query response inlined for the requesting viewer.
/// </summary>
public sealed partial class Router(
    RequestDelegate next,
    HsimahOptions options,
    AuthService auth,
    ImageAssets assets,
    HsimahExecutor executor,
    ILogger<Router> log)
{
    private const int MaxBody = 1_048_576;

    private static readonly Dictionary<string, string> ContentTypes = new()
    {
        [".js"] = "application/javascript",
        [".css"] = "text/css",
        [".svg"] = "image/svg+xml",
        [".png"] = "image/png",
        [".ico"] = "image/x-icon",
    };

    private readonly Lazy<InitialData> initial = new(() => new InitialData(Hsimah.Tsquid.TsquidManifestFactory.Create(), null));

    public async Task InvokeAsync(HttpContext http)
    {
        _ = next;
        var path = http.Request.Path.Value ?? "/";
        try
        {
            if (path == "/news/feed.xml")
            {
                await FeedAsync(http).ConfigureAwait(false);
            }
            else if (path == "/media" && HttpMethods.IsPost(http.Request.Method))
            {
                await UploadAsync(http).ConfigureAwait(false);
            }
            else if (path.StartsWith("/media/", StringComparison.Ordinal))
            {
                await assets.ServeAsync(http).ConfigureAwait(false);
            }
            else if (path == "/graphql" || path.StartsWith("/auth/", StringComparison.Ordinal))
            {
                await ApiAsync(http, path).ConfigureAwait(false);
            }
            else if (await TryServeFileAsync(http, path).ConfigureAwait(false))
            {
                return;
            }
            else if (Forbidden().IsMatch(path))
            {
                http.Response.StatusCode = 404;
                await http.Response.WriteAsync("Not found", http.RequestAborted).ConfigureAwait(false);
            }
            else
            {
                await ShellAsync(http).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException) when (http.RequestAborted.IsCancellationRequested)
        {
        }
    }

    private async Task FeedAsync(HttpContext http)
    {
        try
        {
            var host = http.Request.Host.Host;
            var scheme = http.Request.IsHttps || !IsLoopback(host) ? "https" : "http";
            using var scope = RequestViewerProvider.Use(Actor.Visitor);
            var feed = await NewsFeed.RenderAsync(http.RequestServices, scheme + "://" + http.Request.Host, http.RequestAborted).ConfigureAwait(false);
            http.Response.ContentType = "application/atom+xml; charset=utf-8";
            http.Response.Headers.CacheControl = "public, max-age=300";
            await http.Response.WriteAsync(feed, http.RequestAborted).ConfigureAwait(false);
        }
        catch (Exception error) when (error is not OperationCanceledException)
        {
            log.LogError(error, "The feed could not be built.");
            http.Response.StatusCode = 503;
            http.Response.ContentType = "text/plain";
            await http.Response.WriteAsync("Feed unavailable", http.RequestAborted).ConfigureAwait(false);
        }
    }

    private async Task UploadAsync(HttpContext http)
    {
        http.Response.Headers.CacheControl = "no-store";
        try
        {
            if (!await auth.CsrfValid(http).ConfigureAwait(false))
            {
                await Json(http, 403, new { error = "Invalid CSRF token." }).ConfigureAwait(false);
                return;
            }

            var actor = await auth.ActorOf(http).ConfigureAwait(false);
            if (!actor.HasRole("admin") && !actor.HasRole("editor"))
            {
                await Json(http, 403, new { error = "Sign in to upload images." }).ConfigureAwait(false);
                return;
            }

            if (!http.Request.HasFormContentType)
            {
                await Json(http, 400, new { error = "Choose an image to upload." }).ConfigureAwait(false);
                return;
            }

            var form = await http.Request.ReadFormAsync(http.RequestAborted).ConfigureAwait(false);
            if (form.Files.GetFile("image") is not { } file)
            {
                await Json(http, 400, new { error = "Choose an image to upload." }).ConfigureAwait(false);
                return;
            }

            if (file.Length > assets.Options.MaxBytes)
            {
                await Json(http, 413, new { error = "Images must be 5 MB or smaller." }).ConfigureAwait(false);
                return;
            }

            await using var stream = file.OpenReadStream();
            var stored = await assets.UploadAsync(stream, http.RequestAborted).ConfigureAwait(false);
            await Json(http, stored.Status, stored.Body).ConfigureAwait(false);
        }
        catch (Exception error) when (error is not OperationCanceledException)
        {
            log.LogError(error, "An image could not be stored.");
            await Json(http, 400, new { error = "The image could not be processed." }).ConfigureAwait(false);
        }
    }

    /// <summary>GraphQL and the authentication endpoints. Failures are generic: nothing about storage or the stack reaches a client.</summary>
    private async Task ApiAsync(HttpContext http, string path)
    {
        http.Response.Headers.CacheControl = "no-store";
        try
        {
            if (path == "/auth/csrf" && HttpMethods.IsGet(http.Request.Method))
            {
                await Json(http, 200, new { token = await auth.Csrf(http).ConfigureAwait(false) }).ConfigureAwait(false);
                return;
            }

            if (!HttpMethods.IsPost(http.Request.Method))
            {
                await Json(http, 405, new { error = "POST required." }).ConfigureAwait(false);
                return;
            }

            if (http.Request.ContentLength > MaxBody)
            {
                await Json(http, 413, new { error = "Request too large." }).ConfigureAwait(false);
                return;
            }

            var raw = await ReadBodyAsync(http).ConfigureAwait(false);
            if (raw is null)
            {
                await Json(http, 413, new { error = "Request too large." }).ConfigureAwait(false);
                return;
            }

            var input = JsonNode.Parse(raw.Length == 0 ? "{}" : raw) as JsonObject ?? throw new InvalidOperationException("Expected an object.");
            switch (path)
            {
                case "/auth/login": await LoginAsync(http, input).ConfigureAwait(false); return;
                case "/auth/logout": await LogoutAsync(http).ConfigureAwait(false); return;
                case "/auth/password": await PasswordAsync(http, input).ConfigureAwait(false); return;
                case "/graphql": await GraphQlAsync(http, raw.Length == 0 ? "{}" : raw, input).ConfigureAwait(false); return;
                default: await Json(http, 404, new { error = "Not found." }).ConfigureAwait(false); return;
            }
        }
        catch (Exception error) when (error is not OperationCanceledException)
        {
            log.LogError(error, "A request could not be processed.");
            if (!http.Response.HasStarted)
            {
                await Json(http, 400, new { errors = new[] { new { message = "The request could not be processed." } } }).ConfigureAwait(false);
            }
        }
    }

    private async Task LoginAsync(HttpContext http, JsonObject input)
    {
        if (!await auth.CsrfValid(http).ConfigureAwait(false))
        {
            await Json(http, 403, new { error = "Invalid CSRF token." }).ConfigureAwait(false);
            return;
        }

        var outcome = await auth.Login(http, Str(input, "username"), Str(input, "password")).ConfigureAwait(false);
        if (outcome.Viewer is null)
        {
            await Json(http, outcome.Status, outcome.Body!).ConfigureAwait(false);
            return;
        }

        var viewer = HsimahSchema.ViewerOf(outcome.Viewer);
        await Json(http, 200, new { viewer = viewer is null ? null : new { id = viewer.Id, displayName = viewer.DisplayName, role = viewer.Role.ToUpperInvariant() } }).ConfigureAwait(false);
    }

    private async Task LogoutAsync(HttpContext http)
    {
        if (!await auth.CsrfValid(http).ConfigureAwait(false))
        {
            await Json(http, 403, new { error = "Invalid CSRF token." }).ConfigureAwait(false);
            return;
        }

        await auth.Logout(http).ConfigureAwait(false);
        await Json(http, 200, new { ok = true }).ConfigureAwait(false);
    }

    private async Task PasswordAsync(HttpContext http, JsonObject input)
    {
        if (!await auth.CsrfValid(http).ConfigureAwait(false))
        {
            await Json(http, 403, new { error = "Invalid CSRF token." }).ConfigureAwait(false);
            return;
        }

        var actor = await auth.ActorOf(http).ConfigureAwait(false);
        var outcome = await auth.ChangePassword(http, actor, Str(input, "currentPassword"), Str(input, "newPassword")).ConfigureAwait(false);
        await Json(http, outcome.Status, outcome.Body!).ConfigureAwait(false);
    }

    private async Task GraphQlAsync(HttpContext http, string raw, JsonObject input)
    {
        if (input["query"] is not JsonValue query || !query.TryGetValue<string>(out var text))
        {
            await Json(http, 400, new { error = "Query required." }).ConfigureAwait(false);
            return;
        }

        var document = Parser.Parse(text);
        if (document.Definitions.OfType<GraphQLOperationDefinition>().Any(operation => operation.Operation == OperationType.Mutation)
            && !await auth.CsrfValid(http).ConfigureAwait(false))
        {
            await Json(http, 403, new { error = "Invalid CSRF token." }).ConfigureAwait(false);
            return;
        }

        var actor = await auth.ActorOf(http).ConfigureAwait(false);
        var request = executor.Serializer.Deserialize<GraphQLRequest>(raw) ?? throw new InvalidOperationException("Not a request.");
        using var scope = RequestViewerProvider.Use(actor);
        var result = await executor.ExecuteAsync(request, http.RequestServices, http.RequestAborted).ConfigureAwait(false);
        http.Response.StatusCode = 200;
        http.Response.ContentType = MediaTypeNames.Application.Json;
        http.Response.Headers.CacheControl = "no-store";
        await executor.Serializer.WriteAsync(http.Response.Body, result, http.RequestAborted).ConfigureAwait(false);
    }

    private async Task<bool> TryServeFileAsync(HttpContext http, string path)
    {
        var root = Path.GetFullPath(options.ClientDirectory);
        var file = Path.GetFullPath(Path.Combine(root, path.TrimStart('/')));
        if (!file.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal) || !File.Exists(file))
        {
            return false;
        }

        http.Response.ContentType = ContentTypes.GetValueOrDefault(Path.GetExtension(file), "application/octet-stream");
        await http.Response.SendFileAsync(file, http.RequestAborted).ConfigureAwait(false);
        return true;
    }

    /// <summary>
    /// The client shell, with the initial route's query inlined as #tsquid-data and executed as this request's viewer. Any failure serves
    /// the plain shell; the client then fetches the route query itself.
    /// </summary>
    private async Task ShellAsync(HttpContext http)
    {
        http.Response.ContentType = "text/html; charset=utf-8";
        var shell = await File.ReadAllTextAsync(Path.Combine(options.ClientDirectory, "index.html"), http.RequestAborted).ConfigureAwait(false);
        try
        {
            var actor = await auth.ActorOf(http).ConfigureAwait(false);
            using var scope = RequestViewerProvider.Use(actor);
            var target = http.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpRequestFeature>()?.RawTarget is { Length: > 0 } raw ? raw : http.Request.Path + http.Request.QueryString;
            var page = await initial.Value.RenderAsync(target, shell, (query, variables, operation, _, token) => ExecuteAsync(http, query, variables, operation, token), http.RequestAborted).ConfigureAwait(false);
            foreach (var (name, value) in page.Headers)
            {
                http.Response.Headers[name] = value;
            }

            await http.Response.WriteAsync(page.Body, http.RequestAborted).ConfigureAwait(false);
        }
        catch (Exception error) when (error is not OperationCanceledException)
        {
            log.LogError(error, "The initial data could not be inlined.");
            if (!http.Response.HasStarted)
            {
                http.Response.Headers.Remove("Cache-Control");
                await http.Response.WriteAsync(shell, http.RequestAborted).ConfigureAwait(false);
            }
        }
    }

    /// <summary>A response with errors is not inlined: the client fetches the route query itself and handles them.</summary>
    private async Task<string?> ExecuteAsync(HttpContext http, string text, IReadOnlyDictionary<string, object?> variables, string operation, CancellationToken token)
    {
        var request = new GraphQLRequest { Query = text, OperationName = operation, Variables = new Inputs(new Dictionary<string, object?>(variables)) };
        var result = await executor.ExecuteAsync(request, http.RequestServices, token).ConfigureAwait(false);
        return result.Errors is { Count: > 0 } ? null : executor.Serializer.Serialize(result);
    }

    private static async Task<string?> ReadBodyAsync(HttpContext http)
    {
        using var buffer = new MemoryStream();
        var chunk = new byte[8192];
        int read;
        while ((read = await http.Request.Body.ReadAsync(chunk, http.RequestAborted).ConfigureAwait(false)) > 0)
        {
            buffer.Write(chunk, 0, read);
            if (buffer.Length > MaxBody)
            {
                return null;
            }
        }

        return System.Text.Encoding.UTF8.GetString(buffer.ToArray());
    }

    private static string Str(JsonObject input, string key) => input[key] is JsonValue value && value.TryGetValue<string>(out var text) ? text : string.Empty;

    private static bool IsLoopback(string host) => host is "localhost" or "127.0.0.1" or "[::1]" or "::1";

    private static async Task Json(HttpContext http, int status, object body)
    {
        http.Response.StatusCode = status;
        http.Response.ContentType = MediaTypeNames.Application.Json;
        http.Response.Headers.CacheControl = "no-store";
        await http.Response.WriteAsync(JsonSerializer.Serialize(body), http.RequestAborted).ConfigureAwait(false);
    }

    [GeneratedRegex(@"^/(?:\.git|vendor|spec|generated|server|\.var|\.env|composer\.|src|tests|scripts|eleph|appsettings)")]
    private static partial Regex Forbidden();
}
