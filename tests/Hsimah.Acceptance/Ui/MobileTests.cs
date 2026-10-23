using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Contents;
using static Hsimah.Acceptance.Lib.Ui;
using static Microsoft.Playwright.Assertions;

namespace Hsimah.Acceptance.Ui;

// Phone-sized screens (website.md): no sideways scrolling, a disclosure menu for the site navigation, and touch targets of at least
// 44 by 44 CSS pixels.
public class MobileTests : BrowserTest
{
    private Api api = null!;

    protected override BrowserNewContextOptions ContextOptions() =>
        new() { ViewportSize = new ViewportSize { Width = 360, Height = 740 }, IsMobile = true, HasTouch = true };

    public override async ValueTask InitializeAsync()
    {
        await base.InitializeAsync();
        api = await Api.Operator();
        await EnsurePage(api, "home", "PUBLISHED", Input(("title", "Welcome"), ("content", "# Welcome\n\nHome page body.")));
        await EnsurePage(api, "services", "PUBLISHED", Input(("title", "Services")));
    }

    public override async ValueTask DisposeAsync()
    {
        await api.DisposeAsync();
        await base.DisposeAsync();
    }

    private Task<int> Overflow() => Page.EvaluateAsync<int>("() => document.documentElement.scrollWidth - document.documentElement.clientWidth");

    private ILocator MenuButton() => Page.GetByRole(AriaRole.Navigation, new() { Name = "Main navigation" }).GetByRole(AriaRole.Button, new() { Name = "Menu" });

    private ILocator NavLink(string href) => Page.GetByRole(AriaRole.Navigation, new() { Name = "Main navigation" }).Locator($"a[href=\"{href}\"]");

    private static async Task ExpectTouchTarget(ILocator target, string label)
    {
        var box = await target.BoundingBoxAsync();
        Assert.True(box is not null, $"{label} is laid out");
        Assert.True(box!.Width >= 44, $"{label} width");
        Assert.True(box.Height >= 44, $"{label} height");
    }

    [Fact]
    public async Task Public_and_admin_screens_fit_the_width_without_sideways_scrolling()
    {
        var post = await CreatePublished(api, Kind.Article, Input(("content", $"A {string.Concat(Enumerable.Repeat("long ", 60))}body with an unbroken {new string('x', 40)} word.")));
        foreach (var path in new[] { "/", "/pages/news", "/pages/products", PublicPath(Kind.Article, post.Slug), $"/pages/missing-{UniqueSlug()}", "/admin/login" })
        {
            await Page.GotoAsync(path);
            await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 }).First).ToBeVisibleAsync();
            Assert.True(await Overflow() <= 0, $"{path} overflows");
        }

        await SignIn(Page);
        foreach (var path in new[] { "/admin", "/admin/items/news", "/admin/items/news/new" })
        {
            await Page.GotoAsync(path);
            await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 }).First).ToBeVisibleAsync();
            Assert.True(await Overflow() <= 0, $"{path} overflows");
        }
    }

    [Fact]
    public async Task The_navigation_collapses_behind_a_menu_button_that_opens_and_closes_accessibly()
    {
        await Page.GotoAsync("/");
        var button = MenuButton();
        await Expect(button).ToBeVisibleAsync();
        await Expect(button).ToHaveAttributeAsync("aria-expanded", "false");
        var controls = await button.GetAttributeAsync("aria-controls");
        Assert.False(string.IsNullOrEmpty(controls), "the button names the region it controls");
        await Expect(NavLink("/pages/services")).ToBeHiddenAsync();

        await button.ClickAsync();
        await Expect(button).ToHaveAttributeAsync("aria-expanded", "true");
        await Expect(Page.Locator($"[id=\"{controls}\"]")).ToBeVisibleAsync();
        await Expect(NavLink("/pages/services")).ToBeVisibleAsync();

        await Page.Keyboard.PressAsync("Tab");
        await Page.Keyboard.PressAsync("Escape");
        await Expect(button).ToHaveAttributeAsync("aria-expanded", "false");
        await Expect(button, "Escape returns focus to the menu button").ToBeFocusedAsync();
        await Expect(NavLink("/pages/services")).ToBeHiddenAsync();

        await button.ClickAsync();
        await NavLink("/pages/services").ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}/pages/services");
        await Expect(button, "following a link closes the menu").ToHaveAttributeAsync("aria-expanded", "false");
    }

    [Fact]
    public async Task The_current_page_is_marked_in_the_open_menu_by_more_than_colour()
    {
        await Page.GotoAsync("/pages/services");
        await MenuButton().ClickAsync();
        var current = NavLink("/pages/services");
        await Expect(current).ToHaveAttributeAsync("aria-current", "page");
        Assert.True(await current.EvaluateAsync<string>("element => getComputedStyle(element).backgroundSize") == "100% 2px", "its underline is drawn");
    }

    [Fact]
    public async Task Menu_navigation_mode_toggle_and_footer_links_are_at_least_44px_touch_targets()
    {
        await Page.GotoAsync("/");
        await ExpectTouchTarget(MenuButton(), "menu button");
        await ExpectTouchTarget(Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Button, new() { NameRegex = Rx("switch to (dark|light) mode") }), "colour mode toggle");
        await ExpectTouchTarget(Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Button, new() { NameRegex = Rx("turn (on|off) animations") }), "animation toggle");
        await MenuButton().ClickAsync();
        foreach (var href in new[] { "/", "/pages/services" })
        {
            await ExpectTouchTarget(NavLink(href), $"nav link {href}");
        }

        foreach (var link in await Page.GetByRole(AriaRole.Contentinfo).GetByRole(AriaRole.Link).AllAsync())
        {
            await ExpectTouchTarget(link, $"footer link {await link.GetAttributeAsync("aria-label")}");
        }
    }
}
