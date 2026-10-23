using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Contents;

namespace Hsimah.Acceptance.Http;

// Initial data (architecture.md § Frontend, tests/README.md § HTML contract): the HTML for a route carries that route's query
// response, executed as the requesting viewer, in <script type="application/json" id="tsquid-data">.
public partial class InitialDataTests : IAsyncLifetime
{
    private static readonly JsonSerializerOptions Plain = new() { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

    private Api visitor = null!;
    private Api operatorSession = null!;

    public async ValueTask InitializeAsync()
    {
        visitor = await Api.Anonymous();
        operatorSession = await Api.Operator();
    }

    public async ValueTask DisposeAsync()
    {
        await visitor.DisposeAsync();
        await operatorSession.DisposeAsync();
    }

    private static async Task<(IAPIResponse Response, string Body, JsonNode? Payload)> Html(Api api, string path)
    {
        var response = await api.Context.GetAsync(path);
        Assert.True(response.Status == 200, $"GET {path}");
        Assert.Matches("^text/html", response.Headers.GetValueOrDefault("content-type") ?? "");
        var body = await response.TextAsync();
        var match = PayloadPattern().Match(body);
        JsonNode? payload = null;
        if (match.Success)
        {
            payload = JsonNode.Parse(match.Groups[1].Value);
        }

        return (response, body, payload);
    }

    private static string Text(JsonNode? node) => node?.ToJsonString(Plain) ?? "null";

    [Fact]
    public async Task A_public_route_inlines_its_query_response_and_is_not_shared_cacheable()
    {
        var post = await CreatePublished(operatorSession, Kind.Article);
        var (response, _, payload) = await Html(visitor, PublicPath(Kind.Article, post.Slug));
        Assert.NotNull(payload);
        Assert.Equal(1, payload!["version"]!.GetValue<int>());
        var responses = payload["responses"]!.AsArray();
        Assert.Single(responses);
        var entry = responses[0]!;
        var variables = entry["variables"]!.AsObject();
        Assert.Equal(2, variables.Count);
        Assert.Equal("news", variables["page"]!.GetValue<string>());
        Assert.Equal(post.Slug, variables["slug"]!.GetValue<string>());
        Assert.Contains(post.Title, Text(entry["response"]!["data"]));
        Assert.Matches("private|no-store", response.Headers.GetValueOrDefault("cache-control") ?? "");
        Assert.Empty(Api.SetCookies(response).Select(cookie => cookie.Name));
    }

    [Fact]
    public async Task Page_routes_bind_their_URL_cursor()
    {
        await CreatePublished(operatorSession, Kind.Product);
        foreach (var path in new[] { "/pages/news", "/pages/products" })
        {
            var (_, _, payload) = await Html(visitor, path);
            var responses = payload?["responses"]?.AsArray();
            Assert.True(responses?.Count == 1, $"{path} inlines its list query");
            Assert.Null(responses![0]!["variables"]!["after"]);
        }
    }

    [Fact]
    public async Task Drafts_are_inlined_only_for_staff()
    {
        var draft = await CreateOk(operatorSession, Kind.Article, Input(("title", $"Draft {UniqueSlug("secret")}")));
        var path = PublicPath(Kind.Article, draft.Slug);
        var anonymous = await Html(visitor, path);
        Assert.DoesNotContain(draft.Title, anonymous.Body);
        Assert.DoesNotContain(draft.Body, anonymous.Body);
        var staff = await Html(operatorSession, path);
        Assert.Contains(draft.Title, Text(staff.Payload?["responses"]?[0]?["response"]?["data"]));
    }

    [Fact]
    public async Task Private_profile_data_is_inlined_only_for_the_operator()
    {
        var viewer = await operatorSession.Viewer();
        var path = $"/admin/users/{Uri.EscapeDataString(viewer!["id"]!.GetValue<string>())}";
        Assert.DoesNotContain(Env.Username, (await Html(visitor, path)).Body);
        var signedIn = await Html(operatorSession, path);
        Assert.Contains(Env.Username, Text(signedIn.Payload?["responses"]?[0]?["response"]?["data"]));
        Assert.Matches("private|no-store", signedIn.Response.Headers.GetValueOrDefault("cache-control") ?? "");
    }

    [Fact]
    public async Task Inlined_content_cannot_break_out_of_its_script_element()
    {
        const string hostile = "</script><script>window.__xss=1</script><!--";
        var post = await CreatePublished(operatorSession, Kind.Article, Input(("title", $"T {hostile}"), ("excerpt", hostile), ("content", $"{hostile}\n\n</SCRIPT >")));
        var (_, body, payload) = await Html(visitor, PublicPath(Kind.Article, post.Slug));
        Assert.NotNull(payload);
        Assert.Contains(hostile, Text(payload));
        Assert.DoesNotContain("<script>window.__xss", body);
    }

    [Fact]
    public async Task URLs_that_match_no_route_get_the_plain_shell()
    {
        foreach (var path in new[] { $"/nothing-{UniqueSlug()}", "/news/a/b/c", "/news/%E0%A4%A", "/pages/a/b" })
        {
            var (_, _, payload) = await Html(visitor, path);
            Assert.True(payload is null, path);
        }
    }

    [GeneratedRegex(@"<script type=""application/json"" id=""tsquid-data"">([\s\S]*?)</script>")]
    private static partial Regex PayloadPattern();
}
