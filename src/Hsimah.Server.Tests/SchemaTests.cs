using System.Text.Json.Nodes;
using Elephentity.Runtime.Verification;
using Hsimah.Domain;
using Hsimah.Entity;
using Microsoft.Extensions.DependencyInjection;

namespace Hsimah.Tests;

public class SchemaTests : IDisposable
{
    private readonly Stack stack = new();

    public void Dispose() => stack.Dispose();

    private static string Id(JsonNode result, string mutation, string field) => result["data"]![mutation]![field]!["id"]!.GetValue<string>();

    [Fact]
    public async Task Defaults_and_publication_are_applied_through_the_generated_contracts()
    {
        var created = await stack.Execute("mutation { createPage(input:{title:\"Test\",slug:\"test\"}) { page { id status content excerpt } } }", actor: Actor.Operator);
        Assert.Null(created["errors"]);
        var row = created["data"]!["createPage"]!["page"]!;
        Assert.Equal("DRAFT", row["status"]!.GetValue<string>());
        Assert.Equal("", row["content"]!.GetValue<string>());
        const string publish = "mutation($id:ID!) { publishPage(input:{id:$id}) { page { publishedAt } } }";
        var invalid = await stack.Execute(publish, new { id = row["id"]!.GetValue<string>() }, Actor.Operator);
        Assert.NotNull(invalid["errors"]);
        var id = Elephentity.GraphQL.Relay.GlobalId.EntityIdOf(row["id"]!.GetValue<string>(), "Page")!;
        using (RequestViewerProvider.Use(Actor.Operator))
        {
            await stack.Runtime.UpdateAsync("Page", id, new Dictionary<string, object?> { ["content"] = "Body" });
        }

        var published = await stack.Execute(publish, new { id = row["id"]!.GetValue<string>() }, Actor.Operator);
        Assert.Null(published["errors"]);
        var time = published["data"]!["publishPage"]!["page"]!["publishedAt"]!.GetValue<string>();
        var repeated = await stack.Execute(publish, new { id = row["id"]!.GetValue<string>() }, Actor.Operator);
        Assert.Equal(time, repeated["data"]!["publishPage"]!["page"]!["publishedAt"]!.GetValue<string>());
    }

    [Fact]
    public async Task A_duplicate_username_is_rejected_atomically()
    {
        var input = new Dictionary<string, object?> { ["username"] = "operator", ["displayName"] = "Operator", ["role"] = "admin", ["active"] = true };
        await stack.Create("User", input);
        await Assert.ThrowsAsync<CommitRejectedException>(() => stack.Create("User", input));
    }

    [Fact]
    public async Task The_author_is_the_signed_in_accounts_display_name_only()
    {
        var user = await stack.Create("User", new() { ["username"] = "adminhabl", ["displayName"] = "hblake", ["role"] = "admin", ["active"] = true });
        var account = Assert.IsType<User>(user.Entity);
        var signedIn = new Actor(account);
        var page = await stack.Execute("mutation { createPage(input:{title:\"News\",slug:\"news\",content:\"News.\",defaultItemKind:\"Article\"}) { page { id author { displayName } } } }", actor: signedIn);
        Assert.Equal("hblake", page["data"]!["createPage"]!["page"]!["author"]!["displayName"]!.GetValue<string>());
        var item = await stack.Execute("mutation($page:ID!) { createPageItem(input:{title:\"Hello\",slug:\"hello\",page:$page}) { pageItem { kind author { displayName } } } }", new { page = Id(page, "createPage", "page") }, signedIn);
        var made = item["data"]!["createPageItem"]!["pageItem"]!;
        Assert.Equal("Article", made["kind"]!.GetValue<string>());
        Assert.Equal("hblake", made["author"]!["displayName"]!.GetValue<string>());
        var noClientAuthor = await stack.Execute("mutation { createPage(input:{title:\"X\",slug:\"x\",author:\"1\"}) { page { id } } }", actor: signedIn);
        Assert.NotNull(noClientAuthor["errors"]);
    }

    [Fact]
    public async Task An_item_needs_a_page_that_holds_items()
    {
        var plain = await stack.Execute("mutation { createPage(input:{title:\"Plain\",slug:\"plain\"}) { page { id } } }", actor: Actor.Operator);
        var id = Id(plain, "createPage", "page");
        foreach (var page in new string?[] { null, id, "nope" })
        {
            var result = await stack.Execute("mutation($page:ID) { createPageItem(input:{title:\"T\",slug:\"t\",page:$page}) { pageItem { id } } }", new { page }, Actor.Operator);
            Assert.NotNull(result["errors"]);
        }

        using (RequestViewerProvider.Use(Actor.Operator))
        {
            Assert.Equal(0, await stack.Runtime.All("PageItem").CountAsync());
        }
    }

    [Fact]
    public async Task Reserved_slugs_cannot_name_a_page()
    {
        foreach (var slug in Rules.ReservedSlugs)
        {
            var result = await stack.Execute($"mutation {{ createPage(input:{{title:\"T\",slug:\"{slug}\"}}) {{ page {{ id }} }} }}", actor: Actor.Operator);
            Assert.True(result["errors"] is not null, slug);
        }
    }

    [Fact]
    public async Task Placed_pages_are_published_and_in_placement_order()
    {
        (string Slug, int Order, bool Publish, bool Navigation)[] pages = [("later", 2, true, false), ("first", 1, true, false), ("draft", 0, false, true), ("nav-b", 100, true, true), ("nav-a", 100, true, true)];
        foreach (var (slug, order, publish, navigation) in pages)
        {
            var feature = slug.StartsWith("nav", StringComparison.Ordinal) ? "false" : "true";
            var created = await stack.Execute(
                $"mutation {{ createPage(input:{{title:\"{char.ToUpperInvariant(slug[0])}{slug[1..]}\",slug:\"{slug}\",content:\"Body.\",featureOnHome:{feature},homeOrder:{order},accent:BLUE,showInNavigation:{navigation.ToString().ToLowerInvariant()}}}) {{ page {{ id }} }} }}",
                actor: Actor.Operator);
            Assert.Null(created["errors"]);
            if (publish)
            {
                await stack.Execute("mutation($id:ID!) { publishPage(input:{id:$id}) { page { id } } }", new { id = Id(created, "createPage", "page") }, Actor.Operator);
            }
        }

        async Task<string[]> Slugs(bool home)
        {
            var result = await stack.Execute("query($home:Boolean!) { placedPages(where:{home:$home}, first:100) { nodes { slug } } }", new { home });
            return result["data"]!["placedPages"]!["nodes"]!.AsArray().Select(node => node!["slug"]!.GetValue<string>()).ToArray();
        }

        Assert.Equal(["first", "later"], await Slugs(true));
        Assert.Equal(["nav-a", "nav-b"], await Slugs(false));
    }

    [Fact]
    public async Task Recent_items_list_the_newest_edited_first_and_filter_by_status()
    {
        var news = await stack.Execute("mutation { createPage(input:{title:\"News\",slug:\"news\",content:\"News.\",defaultItemKind:\"Article\"}) { page { id } } }", actor: Actor.Operator);
        var page = Id(news, "createPage", "page");
        var ids = new Dictionary<string, string>();
        foreach (var slug in new[] { "old", "middle", "new" })
        {
            await Task.Delay(1_100);
            var created = await stack.Execute($"mutation {{ createPageItem(input:{{title:\"{slug}\",slug:\"{slug}\",content:\"Body.\",page:\"{page}\"}}) {{ pageItem {{ id }} }} }}", actor: Actor.Operator);
            ids[slug] = Id(created, "createPageItem", "pageItem");
        }

        await Task.Delay(1_100);
        await stack.Execute("mutation($id:ID!) { publishPageItem(input:{id:$id}) { pageItem { id } } }", new { id = ids["middle"] }, Actor.Operator);

        async Task<string[]> Slugs(string where)
        {
            var result = await stack.Execute($"{{ recentPageItems({where} first:2) {{ nodes {{ slug }} }} }}", actor: Actor.Operator);
            return result["data"]!["recentPageItems"]!["nodes"]!.AsArray().Select(node => node!["slug"]!.GetValue<string>()).ToArray();
        }

        Assert.Equal(["middle", "new"], await Slugs(string.Empty));
        Assert.Equal(["new", "old"], await Slugs("where:{status:DRAFT},"));
    }
}
