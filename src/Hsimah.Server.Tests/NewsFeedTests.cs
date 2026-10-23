using System.Xml.Linq;
using Hsimah.Domain;
using Hsimah.Http;

namespace Hsimah.Tests;

public class NewsFeedTests : IDisposable
{
    private readonly Stack stack = new();

    public void Dispose() => stack.Dispose();

    [Fact]
    public async Task The_feed_lists_only_published_articles_with_escaped_text()
    {
        await stack.Create("User", new() { ["username"] = "operator", ["displayName"] = "hblake", ["role"] = "admin", ["active"] = true });
        var page = await stack.Execute("mutation { createPage(input:{title:\"News\",slug:\"news\",content:\"News.\",defaultItemKind:\"Article\"}) { page { id } } }", actor: Actor.Operator);
        var pageId = page["data"]!["createPage"]!["page"]!["id"]!.GetValue<string>();
        await stack.Execute("mutation($id:ID!) { publishPage(input:{id:$id}) { page { id } } }", new { id = pageId }, Actor.Operator);
        var created = await stack.Execute(
            "mutation($page:ID!) { createPageItem(input:{title:\"Fish & <chips>\",slug:\"fish-chips\",content:\"Body.\",excerpt:\"A summary.\",page:$page}) { pageItem { id } } }",
            new { page = pageId }, Actor.Operator);
        var itemId = created["data"]!["createPageItem"]!["pageItem"]!["id"]!.GetValue<string>();
        var published = await stack.Execute("mutation($id:ID!) { publishPageItem(input:{id:$id}) { pageItem { status } } }", new { id = itemId }, Actor.Operator);
        Assert.Equal("PUBLISHED", published["data"]!["publishPageItem"]!["pageItem"]!["status"]!.GetValue<string>());
        await stack.Execute("mutation($page:ID!) { createPageItem(input:{title:\"Secret draft\",slug:\"secret-draft\",content:\"Not yet.\",page:$page}) { pageItem { id } } }", new { page = pageId }, Actor.Operator);

        var xml = await NewsFeed.RenderAsync(stack.Services, "https://hbla.ke", CancellationToken.None);
        var feed = XDocument.Parse(xml).Root!;
        XNamespace atom = "http://www.w3.org/2005/Atom";
        var entries = feed.Elements(atom + "entry").ToList();
        Assert.Single(entries);
        Assert.Equal("Fish & <chips>", entries[0].Element(atom + "title")!.Value);
        Assert.Equal("https://hbla.ke/news/fish-chips", entries[0].Element(atom + "id")!.Value);
        Assert.Equal("hblake", entries[0].Element(atom + "author")!.Element(atom + "name")!.Value);
        Assert.DoesNotContain("Secret draft", xml);
    }
}
