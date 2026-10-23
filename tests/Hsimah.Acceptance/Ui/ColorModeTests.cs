using System.Text.RegularExpressions;
using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Contents;
using static Hsimah.Acceptance.Lib.Ui;
using static Microsoft.Playwright.Assertions;

namespace Hsimah.Acceptance.Ui;

// Light/dark mode (website.md): the site follows the system colour scheme until the visitor picks one with the header toggle. The
// choice is remembered on the device and applied before first paint, and every mode keeps WCAG AA contrast.
public class ColorModeTests : BrowserTest
{
    private Api api = null!;

    public override async ValueTask InitializeAsync()
    {
        await base.InitializeAsync();
        api = await Api.Operator();
        await EnsurePage(api, "home", "PUBLISHED", Input(("title", "Welcome"), ("content", "# Welcome\n\nHome page body.")));
    }

    public override async ValueTask DisposeAsync()
    {
        await api.DisposeAsync();
        await base.DisposeAsync();
    }

    private Task<string> Scheme() => Page.EvaluateAsync<string>("() => getComputedStyle(document.documentElement).colorScheme");

    [Theory]
    [InlineData("light", "dark")]
    [InlineData("dark", "light")]
    public async Task The_toggle_switches_mode_says_so_and_keeps_AA_contrast(string system, string other)
    {
        await Use(new BrowserNewContextOptions { ColorScheme = system == "light" ? ColorScheme.Light : ColorScheme.Dark });
        var post = await CreatePublished(api, Kind.Article);
        await Page.GotoAsync(PublicPath(Kind.Article, post.Slug));
        Assert.Matches(system, await Scheme());
        var toggle = Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Button, new() { Name = $"Switch to {other} mode" });
        await toggle.ClickAsync();
        Assert.Equal(other, await Scheme());
        await Expect(Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Button, new() { Name = $"Switch to {system} mode" })).ToBeVisibleAsync();
        await Expect(Page.GetByRole(AriaRole.Contentinfo).Locator("img[src*=\"hsimah-\"]")).ToHaveAttributeAsync("src", new Regex($"hsimah-{other}"));
        ILocator[] targets =
        [
            Page.GetByRole(AriaRole.Heading, new() { Level = 1 }),
            Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Link).First,
            Page.GetByRole(AriaRole.Main).Locator("p").First,
            Page.GetByRole(AriaRole.Contentinfo).Locator("p").First,
        ];
        foreach (var target in targets)
        {
            var text = (await target.TextContentAsync())?.Trim() ?? string.Empty;
            Assert.True(await ContrastOf(target) >= 4.5, $"{other} mode contrast: {text[..Math.Min(30, text.Length)]}");
        }
    }

    [Theory]
    [InlineData("light", "dark")]
    [InlineData("dark", "light")]
    public async Task The_choice_is_remembered_and_applied_before_the_app_loads(string system, string other)
    {
        await Use(new BrowserNewContextOptions { ColorScheme = system == "light" ? ColorScheme.Light : ColorScheme.Dark });
        await Page.GotoAsync("/");
        await Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Button, new() { Name = $"Switch to {other} mode" }).ClickAsync();
        // Block the application scripts: only the document itself can set the scheme.
        var scripts = new Regex(@"/assets/.*\.js$");
        await Page.RouteAsync(scripts, route => route.AbortAsync());
        await Page.GotoAsync("/", new() { WaitUntil = WaitUntilState.DOMContentLoaded });
        Assert.True(await Scheme() == other, "before the app runs");
        await Page.UnrouteAsync(scripts);
        await Page.ReloadAsync();
        await Expect(Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Button, new() { Name = $"Switch to {system} mode" })).ToBeVisibleAsync();
        Assert.Equal(other, await Scheme());
    }

    [Fact]
    public async Task The_colour_mode_and_animation_toggles_form_one_labelled_group_with_arrow_key_focus()
    {
        await Page.GotoAsync("/");
        var group = Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Group, new() { Name = "Display and account" });
        var buttons = group.GetByRole(AriaRole.Button);
        await Expect(buttons).ToHaveCountAsync(2);
        await Expect(buttons.First).ToHaveAccessibleNameAsync(Rx("switch to (dark|light) mode"));
        await Expect(buttons.Last).ToHaveAccessibleNameAsync(Rx("turn (on|off) animations"));
        await buttons.First.FocusAsync();
        await Page.Keyboard.PressAsync("ArrowRight");
        await Expect(buttons.Last).ToBeFocusedAsync();
        var ring = await buttons.Last.EvaluateAsync<string[]>("""
            element => {
              const style = getComputedStyle(element);
              return [style.outlineStyle, getComputedStyle(element.parentElement).overflow];
            }
            """);
        Assert.True(ring[0] != "none", "a visible focus ring");
        Assert.True(ring[1] == "visible", "the group does not clip it");
    }
}
