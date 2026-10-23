using System.Text.RegularExpressions;
using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Contents;
using static Hsimah.Acceptance.Lib.Ui;
using static Microsoft.Playwright.Assertions;

namespace Hsimah.Acceptance.Ui;

// Animations (website.md): hover animations follow the system's reduced-motion setting until the visitor turns them on or off with
// the header toggle. The choice is remembered and applied before first paint. With animations off, changes still happen (the
// underline still shows) but nothing moves over time and tiles do not grow.
public class MotionTests : BrowserTest
{
    private Api api = null!;

    private static BrowserNewContextOptions Motion(ReducedMotion motion) => new() { ReducedMotion = motion, ViewportSize = new ViewportSize { Width = 1280, Height = 900 } };

    public override async ValueTask InitializeAsync()
    {
        await base.InitializeAsync();
        api = await Api.Operator();
        await EnsurePage(api, "home", "PUBLISHED", Input(("title", "Welcome"), ("content", "# Welcome\n\nHome page body.")));
        var about = await EnsurePage(api, "about", "PUBLISHED", Input(("title", "About")));
        // A home tile needs the page featured with a colour (page placement).
        await Update(api, Kind.Page, about.Id, Input(("featureOnHome", true), ("homeOrder", 0), ("accent", "GREEN")));
    }

    public override async ValueTask DisposeAsync()
    {
        await api.DisposeAsync();
        await base.DisposeAsync();
    }

    private ILocator Toggle(Regex name) => Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Button, new() { NameRegex = name });

    private ILocator NavLink() => Page.GetByRole(AriaRole.Navigation, new() { Name = "Main navigation" }).Locator("a[href=\"/pages/about\"]");

    private ILocator Tile() => Page.GetByRole(AriaRole.Region, new() { Name = "Explore the site" }).Locator("a[href=\"/pages/about\"]");

    private static double Seconds(string value) =>
        value.Split(',').Select(part => part.Trim().EndsWith("ms", StringComparison.Ordinal) ? double.Parse(part.Trim()[..^2], System.Globalization.CultureInfo.InvariantCulture) / 1000 : double.Parse(part.Trim().TrimEnd('s'), System.Globalization.CultureInfo.InvariantCulture)).Max();

    private static async Task<double> LongestTransition(ILocator target) =>
        Seconds(await target.EvaluateAsync<string>("element => getComputedStyle(element).transitionDuration"));

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Animations_start_per_the_system_setting_and_the_toggle_flips_them(bool animated)
    {
        await Use(Motion(animated ? ReducedMotion.NoPreference : ReducedMotion.Reduce));
        await Page.GotoAsync("/");
        var link = NavLink();
        if (animated)
        {
            Assert.True(await LongestTransition(link) > 0.1, "nav hover animates");
        }
        else
        {
            Assert.True(await LongestTransition(link) < 0.01, "nav hover is instant");
        }

        await Toggle(animated ? Rx("turn off animations") : Rx("turn on animations")).ClickAsync();
        await Expect(Toggle(animated ? Rx("turn on animations") : Rx("turn off animations"))).ToBeVisibleAsync();
        if (animated)
        {
            Assert.True(await LongestTransition(link) < 0.01);
        }
        else
        {
            Assert.True(await LongestTransition(link) > 0.1);
        }
    }

    [Fact]
    public async Task With_animations_off_hover_still_underlines_links_but_tiles_do_not_grow()
    {
        await Use(Motion(ReducedMotion.Reduce));
        await Page.GotoAsync("/");
        await NavLink().HoverAsync();
        await PollAsync(() => NavLink().EvaluateAsync<string>("element => getComputedStyle(element).backgroundSize"), "100% 2px");
        await Tile().HoverAsync();
        Assert.Equal("none", await Tile().EvaluateAsync<string>("element => getComputedStyle(element).transform"));
    }

    [Fact]
    public async Task With_animations_on_the_underline_grows_from_the_middle_and_tiles_grow_on_hover()
    {
        await Use(Motion(ReducedMotion.NoPreference));
        await Page.GotoAsync("/");
        var link = NavLink();
        Assert.Matches("^50%", await link.EvaluateAsync<string>("element => getComputedStyle(element).backgroundPosition"));
        await link.HoverAsync();
        await PollAsync(() => link.EvaluateAsync<string>("element => getComputedStyle(element).backgroundSize"), "100% 2px");
        await Tile().HoverAsync();
        await PollUntilAsync(async () => await Tile().EvaluateAsync<string>("element => getComputedStyle(element).transform") != "none");
    }

    [Fact]
    public async Task Turning_animations_off_is_remembered_and_applied_before_the_app_loads()
    {
        await Use(Motion(ReducedMotion.NoPreference));
        await Page.GotoAsync("/");
        await Toggle(Rx("turn off animations")).ClickAsync();
        var scripts = new Regex(@"/assets/.*\.js$");
        await Page.RouteAsync(scripts, route => route.AbortAsync());
        await Page.GotoAsync("/", new() { WaitUntil = WaitUntilState.DOMContentLoaded });
        Assert.True(await Page.EvaluateAsync<string>("() => document.documentElement.getAttribute('data-motion')") == "reduce", "before the app runs");
        await Page.UnrouteAsync(scripts);
        await Page.ReloadAsync();
        await Expect(Toggle(Rx("turn on animations"))).ToBeVisibleAsync();
        Assert.True(await LongestTransition(NavLink()) < 0.01);
    }

    /// <summary>Polls <paramref name="read" /> until it returns <paramref name="expected" />, as expect.poll does.</summary>
    private static async Task PollAsync(Func<Task<string>> read, string expected)
    {
        string last = string.Empty;
        await PollUntilAsync(async () => (last = await read()) == expected, () => $"expected {expected}, last value {last}");
    }

    private static async Task PollUntilAsync(Func<Task<bool>> check, Func<string>? describe = null)
    {
        var deadline = DateTime.UtcNow.AddSeconds(10);
        while (DateTime.UtcNow < deadline)
        {
            if (await check())
            {
                return;
            }

            await Task.Delay(100);
        }

        Assert.Fail(describe?.Invoke() ?? "condition was not met in time");
    }
}
