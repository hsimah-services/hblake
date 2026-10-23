using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Contents;

namespace Hsimah.Acceptance.Http;

// Secrets, the database, source and backups are unreachable over HTTP (acceptance 11). The SPA may answer unknown paths with its
// shell, so each response is checked for the file's contents rather than only for its status.
public class HttpTests
{
    private static readonly string[] Paths =
    [
        "/.env",
        "/.env.local",
        "/.git/config",
        "/.git/HEAD",
        "/composer.json",
        "/composer.lock",
        "/eleph.json",
        "/package.json",
        "/appsettings.json",
        "/Hsimah.Server.csproj",
        "/Hsimah.Server.dll",
        "/vendor/autoload.php",
        "/spec/project.yml",
        "/spec/entities/User.yml",
        "/generated/Catalogue.php",
        "/src/Hsimah.Server/Program.cs",
        "/src/Bootstrap.php",
        "/index.php.bak",
        "/database.sqlite",
        "/data.sqlite",
        "/hsimah.sqlite",
        "/db.sqlite3",
        "/var/data.sqlite",
        "/data/hsimah.sqlite",
        "/storage/database.sqlite",
        "/backups/",
        "/backup.sqlite",
    ];

    private static readonly (string What, Regex Pattern)[] Leaks =
    [
        ("SQLite database", new Regex("SQLite format 3")),
        ("PHP source", new Regex(@"<\?php")),
        ("C# source", new Regex(@"^namespace\s+Hsimah|using Elephentity\.", RegexOptions.Multiline)),
        ("git metadata", new Regex(@"\[core\]|^ref: refs/", RegexOptions.Multiline)),
        ("Composer manifest", new Regex(@"""require""\s*:|""packages""\s*:")),
        ("Elephentity config or spec", new Regex(@"""targets""\s*:|^project:\s*Hsimah|^entity:\s*User", RegexOptions.Multiline)),
        ("environment file", new Regex(@"^[A-Z][A-Z0-9_]*=.+", RegexOptions.Multiline)),
        ("directory listing", new Regex(@"Index of /")),
    ];

    [Fact]
    public async Task Sensitive_files_are_not_served()
    {
        await using var api = await Api.Anonymous();
        var leaks = new List<string>();
        foreach (var path in Paths)
        {
            var response = await api.Context.GetAsync(path, new() { MaxRedirects = 0 });
            if (response.Status >= 300)
            {
                continue;
            }

            var body = Encoding.Latin1.GetString((await response.BodyAsync()).Take(64 * 1024).ToArray());
            leaks.AddRange(Leaks.Where(leak => leak.Pattern.IsMatch(body)).Select(leak => $"{path} serves a {leak.What}"));
        }

        Assert.Equal(Array.Empty<string>(), leaks.ToArray());
    }

    [Fact]
    public async Task GraphQL_introspection_and_queries_are_served_on_graphql_over_POST()
    {
        await using var api = await Api.Anonymous();
        var response = await api.Context.PostAsync("/graphql", new() { DataObject = new { query = "{ __typename }" }, Headers = new Dictionary<string, string> { ["content-type"] = "application/json" } });
        Assert.Equal(200, response.Status);
        Assert.False(string.IsNullOrEmpty((await response.JsonAsync())!.Value.GetProperty("data").GetProperty("__typename").GetString()));
    }

    [Fact]
    public async Task The_removed_Post_and_Product_addresses_are_not_served_as_content()
    {
        await using var api = await Api.Anonymous();
        foreach (var path in new[] { "/posts", "/posts/some-story", "/admin/posts", "/admin/news", "/admin/products" })
        {
            var response = await api.Context.GetAsync(path, new() { MaxRedirects = 0 });
            Assert.True(response.Status != 301, path);
            Assert.False(response.Headers.ContainsKey("location"), $"{path} does not redirect");
        }
    }

    [Fact]
    public async Task The_News_Atom_feed_lists_published_articles_only_safely_escaped()
    {
        await using var operatorSession = await Api.Operator();
        var published = await CreatePublished(operatorSession, Kind.Article, Input(("title", $"Feed & <friends> {UniqueSlug()}")));
        var draft = await CreateOk(operatorSession, Kind.Article, Input(("title", $"Feed draft {UniqueSlug()}")));
        await using var api = await Api.Anonymous();
        var response = await api.Context.GetAsync("/news/feed.xml");
        Assert.Equal(200, response.Status);
        Assert.Matches("^application/atom\\+xml", response.Headers["content-type"]);
        var body = await response.TextAsync();
        Assert.Contains("<feed xmlns=\"http://www.w3.org/2005/Atom\">", body);
        Assert.Contains(published.Title.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;"), body);
        Assert.Contains($"/news/{published.Slug}", body);
        Assert.DoesNotContain(draft.Title, body);
        // The site advertises it from every page.
        await using var page = await Api.Anonymous();
        Assert.Contains("type=\"application/atom+xml\"", await (await page.Context.GetAsync("/")).TextAsync());
    }
}
