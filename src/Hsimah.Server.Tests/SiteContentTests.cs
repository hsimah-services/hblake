using Hsimah.Domain;
using Hsimah.Entity;

namespace Hsimah.Tests;

public class SiteContentTests : IDisposable
{
    private readonly Stack stack = new();

    public void Dispose() => stack.Dispose();

    [Fact]
    public async Task Replacement_publishes_the_seed_pages_and_preserves_the_operator()
    {
        var user = await stack.Create("User", new() { ["username"] = "operator", ["displayName"] = "Operator", ["role"] = "admin", ["active"] = true });
        var old = await stack.Create("Page", new() { ["title"] = "Old", ["slug"] = "old", ["defaultItemKind"] = "Article" });
        await stack.Create("PageItem", new() { ["title"] = "Old item", ["slug"] = "old-item", ["kind"] = "Article", ["page"] = old.Id.ToString() });

        using (RequestViewerProvider.Use(Actor.Operator))
        {
            await Operator.ReplaceContentAsync(stack.Services);
            await Operator.ReplaceContentAsync(stack.Services);

            var pages = (await stack.Runtime.All("Page").AllAsync()).OfType<Page>().ToList();
            Assert.Equal(6, pages.Count(page => page.Status == Hsimah.Entity.Enums.PublicationStatus.Published));
            Assert.Equal(0, await stack.Runtime.All("PageItem").CountAsync());
            Assert.Equal(["Article", "Product"], pages.Where(page => page.Slug is "news" or "products").OrderBy(page => page.Slug).Select(page => page.DefaultItemKind));
            foreach (var page in pages)
            {
                Assert.True(await page.GetAuthorAsync() is not null, $"{page.Slug} is written by the operator");
            }

            var users = (await stack.Runtime.All("User").AllAsync()).OfType<User>().ToList();
            Assert.Single(users);
            Assert.Equal(user.Id, users[0].Id);
        }
    }

    [Fact]
    public async Task A_refused_replacement_leaves_content_alone()
    {
        await stack.Create("Page", new() { ["title"] = "Existing", ["slug"] = "existing" });
        using (RequestViewerProvider.Use(Actor.Visitor))
        {
            await Assert.ThrowsAnyAsync<Exception>(() => Operator.ReplaceContentAsync(stack.Services));
        }

        using (RequestViewerProvider.Use(Actor.Operator))
        {
            Assert.Equal("Existing", (await stack.Runtime.All("Page").AllAsync()).OfType<Page>().Single().Title);
        }
    }
}
