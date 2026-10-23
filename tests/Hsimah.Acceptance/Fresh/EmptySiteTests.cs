using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Contents;
using static Microsoft.Playwright.Assertions;

namespace Hsimah.Acceptance.Fresh;

// Runs first, against the database scripts/acceptance/up just installed and bootstrapped: one operator account and no content.
// website.md: News and Products may be empty at launch, with useful empty states and no fabricated content.
public class EmptySiteTests : BrowserTest
{
    [Fact]
    public async Task The_stack_starts_with_no_content()
    {
        await using var api = await Api.Operator();
        foreach (var kind in Kinds)
        {
            var page = await PageOf(api, kind);
            Assert.True(page.TotalCount == 0, $"{Collection(kind)} must be empty; rerun scripts/acceptance/up for a fresh database");
            Assert.Empty(page.Nodes);
        }
    }

    [Fact]
    public async Task Bootstrap_provisions_exactly_the_configured_operator_as_an_admin()
    {
        await using var api = await Api.Operator();
        var viewer = await api.Viewer();
        Assert.Equal(Env.DisplayName, viewer!["displayName"]!.GetValue<string>());
        Assert.Equal("ADMIN", viewer["role"]!.GetValue<string>());
        Assert.False(string.IsNullOrEmpty(viewer["id"]!.GetValue<string>()));
    }

    [Fact]
    public async Task Home_shows_a_meaningful_unavailable_state_when_no_home_page_is_published()
    {
        await Page.GotoAsync("/");
        var main = Page.GetByRole(AriaRole.Main);
        await Expect(main).ToBeVisibleAsync();
        await Expect(main).Not.ToHaveTextAsync(new System.Text.RegularExpressions.Regex(@"^\s*$"));
        await Expect(Page.GetByText(new System.Text.RegularExpressions.Regex("unexpected application error", System.Text.RegularExpressions.RegexOptions.IgnoreCase))).ToHaveCountAsync(0);
    }

    [Fact]
    public async Task Navigation_omits_links_to_pages_that_are_not_published()
    {
        await Page.GotoAsync("/");
        await Expect(Page.GetByRole(AriaRole.Main)).ToBeVisibleAsync();
        foreach (var href in new[] { "/pages/services", "/pages/about", "/pages/contact" })
        {
            await Expect(Page.Locator($"nav a[href=\"{href}\"]")).ToHaveCountAsync(0);
        }
    }

    [Fact]
    public async Task A_page_that_holds_items_says_when_it_has_none()
    {
        // No page exists yet, and an unknown page lists no items rather than failing.
        await HostPage(Kind.Article);
        await HostPage(Kind.Product);
        await Page.GotoAsync("/pages/news");
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToHaveTextAsync("News");
        await Expect(Page.GetByRole(AriaRole.Main).GetByText(new System.Text.RegularExpressions.Regex("no news", System.Text.RegularExpressions.RegexOptions.IgnoreCase))).ToBeVisibleAsync();
        await Page.GotoAsync("/pages/products");
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToHaveTextAsync("Products");
        await Expect(Page.GetByRole(AriaRole.Main).GetByText(new System.Text.RegularExpressions.Regex("no products", System.Text.RegularExpressions.RegexOptions.IgnoreCase))).ToBeVisibleAsync();
    }
}
