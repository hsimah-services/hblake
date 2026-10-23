using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Contents;
using static Hsimah.Acceptance.Lib.Ui;
using static Microsoft.Playwright.Assertions;

namespace Hsimah.Acceptance.Ui;

// The public site (website.md): client-rendered pages, the items they hold, navigation, safe Markdown, metadata and the
// not-found state (acceptance 9 and 10). News and Products are Pages; an Article or a Product is an item of one, at /<page>/<item>.
public partial class PublicSiteTests : BrowserTest
{
    private Api api = null!;

    public override async ValueTask InitializeAsync()
    {
        await base.InitializeAsync();
        api = await Api.Operator();
    }

    public override async ValueTask DisposeAsync()
    {
        await api.DisposeAsync();
        await base.DisposeAsync();
    }

    private Task<Content> Home() => EnsurePage(api, "home", "PUBLISHED", Input(("title", "Welcome"), ("content", "# Welcome\n\nHome page body.")));

    // Home.

    [Fact]
    public async Task Slash_renders_the_published_home_page()
    {
        var home = await Home();
        await Page.GotoAsync("/");
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Name = home.Title, Level = 1 })).ToBeVisibleAsync();
    }

    [Fact]
    public async Task Pages_home_redirects_to_the_canonical_slash()
    {
        var home = await Home();
        await Page.GotoAsync("/pages/home");
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}/");
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Name = home.Title, Level = 1 })).ToBeVisibleAsync();
    }

    // Content pages.

    [Fact]
    public async Task A_published_article_renders_its_Markdown_and_metadata()
    {
        var post = await CreatePublished(api, Kind.Article, Input(
            ("title", $"Rendered {Env.RunId}"),
            ("excerpt", $"A summary for {Env.RunId}."),
            ("content", $"Intro paragraph.\n\n## Section {Env.RunId}\n\nSome **strong** words and a [link](https://example.com/).")));
        await Page.GotoAsync(PublicPath(Kind.Article, post.Slug));
        var main = Page.GetByRole(AriaRole.Main);
        await Expect(main.GetByRole(AriaRole.Heading, new() { Name = post.Title, Level = 1 })).ToBeVisibleAsync();
        await Expect(main.GetByRole(AriaRole.Heading, new() { Name = $"Section {Env.RunId}", Level = 2 })).ToBeVisibleAsync();
        await Expect(main.Locator("strong", new() { HasText = "strong" })).ToBeVisibleAsync();
        await Expect(main.GetByText($"By {Env.DisplayName}")).ToBeVisibleAsync();
        await Expect(main.GetByRole(AriaRole.Link, new() { Name = "link" })).ToHaveAttributeAsync("href", "https://example.com/");

        await Expect(Page).ToHaveTitleAsync(new Regex(Regex.Escape(post.Title)));
        await Expect(Page.Locator("meta[name=\"description\"]")).ToHaveAttributeAsync("content", post.Excerpt);
        await Expect(Page.Locator("link[rel=\"canonical\"]")).ToHaveAttributeAsync("href", $"{Env.BaseUrl}{PublicPath(Kind.Article, post.Slug)}");
        await Expect(Page.Locator("meta[property=\"og:title\"]")).ToHaveAttributeAsync("content", new Regex(Regex.Escape(post.Title)));
    }

    [Fact]
    public async Task Markdown_is_rendered_with_raw_HTML_disabled_and_unsafe_URLs_removed()
    {
        var post = await CreatePublished(api, Kind.Article, Input(
            ("title", $"Hostile {Env.RunId}"),
            ("content", string.Join("\n\n", new[]
            {
                "Safe text.",
                "<script>window.__xss = \"script\"</script>",
                "<img src=\"x\" onerror=\"window.__xss = 'img'\">",
                "<b id=\"raw-html\">raw bold</b>",
                "[bad link](javascript:window.__xss=\"link\")",
                "[data link](data:text/html,<script>parent.__xss=1</script>)",
                "![bad image](javascript:window.__xss=\"image\")",
            }))));
        await Page.GotoAsync(PublicPath(Kind.Article, post.Slug));
        var main = Page.GetByRole(AriaRole.Main);
        await Expect(main.GetByText("Safe text.")).ToBeVisibleAsync();

        Assert.False(await XssFired(Page));
        await Expect(main.Locator("script")).ToHaveCountAsync(0);
        await Expect(main.Locator("[onerror], [onclick], [onload]")).ToHaveCountAsync(0);
        await Expect(main.Locator("#raw-html")).ToHaveCountAsync(0);
        await Expect(main.Locator("a[href^=\"javascript:\" i], a[href^=\"data:\" i], img[src^=\"javascript:\" i]")).ToHaveCountAsync(0);
    }

    [Fact]
    public async Task Unknown_and_unpublished_content_render_the_same_not_found_state()
    {
        var draft = await CreateOk(api, Kind.Article, Input(("title", $"Unreleased {Env.RunId}")));
        var unpublished = await CreatePublished(api, Kind.Page, Input(("title", $"Withdrawn {Env.RunId}")));
        await UnpublishOk(api, Kind.Page, unpublished.Id);

        var article = await CreatePublished(api, Kind.Article, Input(("title", $"On another page {Env.RunId}")));
        string[] paths =
        [
            $"/news/missing-{Env.RunId}",
            $"/pages/missing-{Env.RunId}",
            $"/products/missing-{Env.RunId}",
            $"/missing-{Env.RunId}/{article.Slug}",
            $"/products/{article.Slug}",
            PublicPath(Kind.Article, draft.Slug),
            PublicPath(Kind.Page, unpublished.Slug),
        ];
        foreach (var path in paths)
        {
            await Page.GotoAsync(path);
            await Expect(NotFound(Page), path).ToBeVisibleAsync();
        }

        await Page.GotoAsync(PublicPath(Kind.Article, draft.Slug));
        await Expect(Page.GetByText(draft.Title)).ToHaveCountAsync(0);
    }

    [Fact]
    public async Task The_signed_in_operator_can_preview_a_draft_at_its_public_URL()
    {
        var draft = await CreateOk(api, Kind.Article, Input(("title", $"Preview {Env.RunId}")));
        await SignIn(Page);
        await Page.GotoAsync(PublicPath(Kind.Article, draft.Slug));
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Name = draft.Title, Level = 1 })).ToBeVisibleAsync();
    }

    // Products.

    [Fact]
    public async Task An_enquiry_link_is_shown_only_when_the_item_has_one()
    {
        var https = await CreatePublished(api, Kind.Product, Input(("enquiryUrl", "https://example.com/enquire")));
        var mailto = await CreatePublished(api, Kind.Product, Input(("enquiryUrl", "mailto:hello@example.com")));
        var none = await CreatePublished(api, Kind.Product);

        await Page.GotoAsync(PublicPath(Kind.Product, https.Slug));
        await Expect(Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link, new() { NameRegex = Rx("enquir") })).ToHaveAttributeAsync("href", "https://example.com/enquire");
        await Page.GotoAsync(PublicPath(Kind.Product, mailto.Slug));
        await Expect(Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link, new() { NameRegex = Rx("enquir") })).ToHaveAttributeAsync("href", "mailto:hello@example.com");
        await Page.GotoAsync(PublicPath(Kind.Product, none.Slug));
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Name = none.Title, Level = 1 })).ToBeVisibleAsync();
        await Expect(Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link, new() { NameRegex = Rx("enquir") })).ToHaveCountAsync(0);
    }

    [Fact]
    public async Task A_page_lists_only_its_own_items_newest_first_under_its_own_content()
    {
        var product = await CreatePublished(api, Kind.Product, Input(("title", $"Own product {Env.RunId}")));
        var article = await CreatePublished(api, Kind.Article, Input(("title", $"Elsewhere {Env.RunId}")));
        await Page.GotoAsync(ListPath(Kind.Product));
        var main = Page.GetByRole(AriaRole.Main);
        await Expect(main.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToHaveTextAsync("Products");
        await Expect(main.GetByRole(AriaRole.Link, new() { Name = product.Title })).ToHaveAttributeAsync("href", PublicPath(Kind.Product, product.Slug));
        await Expect(main.GetByText(article.Title)).ToHaveCountAsync(0);
    }

    // News details.

    [Fact]
    public async Task Articles_show_their_date_and_reading_time_and_link_to_newer_and_older_news()
    {
        var older = await CreatePublished(api, Kind.Article, Input(("title", $"Older story {Env.RunId}"), ("content", $"{string.Concat(Enumerable.Repeat("word ", 450))}end.")));
        var newer = await CreatePublished(api, Kind.Article, Input(("title", $"Newer story {Env.RunId}")));
        await Page.GotoAsync(PublicPath(Kind.Article, older.Slug));
        var byline = Page.GetByRole(AriaRole.Main).GetByText(new Regex(@"^By .* min read$"));
        await Expect(byline).ToContainTextAsync("2 min read");
        await Expect(byline.Locator("time")).ToHaveAttributeAsync("datetime", older.PublishedAt!);
        var more = Page.GetByRole(AriaRole.Navigation, new() { Name = "More news" });
        await Expect(more.GetByRole(AriaRole.Link, new() { Name = newer.Title })).ToHaveAttributeAsync("href", PublicPath(Kind.Article, newer.Slug));
        await Page.GotoAsync(PublicPath(Kind.Article, newer.Slug));
        await Expect(Page.GetByRole(AriaRole.Navigation, new() { Name = "More news" }).GetByRole(AriaRole.Link, new() { Name = older.Title })).ToBeVisibleAsync();

        await Page.GotoAsync(ListPath(Kind.Article));
        var item = Page.GetByRole(AriaRole.Main).Locator("article", new() { Has = Page.GetByRole(AriaRole.Link, new() { Name = newer.Title }) });
        await Expect(item.Locator("time")).ToHaveAttributeAsync("datetime", newer.PublishedAt!);
        await Expect(item).ToContainTextAsync(new Regex(@"\d+ min read"));
    }

    // Item list.

    [Fact]
    public async Task A_page_lists_its_published_items_newest_first_and_links_to_them()
    {
        var draft = await CreateOk(api, Kind.Article, Input(("title", $"Listed draft {Env.RunId}")));
        var older = await CreatePublished(api, Kind.Article, Input(("title", $"Listed older {Env.RunId}")));
        var newer = await CreatePublished(api, Kind.Article, Input(("title", $"Listed newer {Env.RunId}")));
        await Page.GotoAsync(ListPath(Kind.Article));
        var main = Page.GetByRole(AriaRole.Main);
        var ours = main.GetByRole(AriaRole.Link, new() { NameRegex = new Regex($"Listed (older|newer|draft) {Env.RunId}") });
        await Expect(ours).ToContainTextAsync(new[] { newer.Title, older.Title });
        await Expect(main.GetByText(draft.Title)).ToHaveCountAsync(0);
        await Expect(main.Locator("article", new() { Has = Page.GetByRole(AriaRole.Link, new() { Name = newer.Title }) })).ToContainTextAsync($"By {Env.DisplayName}");
        await ours.First.ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{PublicPath(Kind.Article, newer.Slug)}");
    }

    [Fact]
    public async Task More_than_one_page_of_items_offers_a_next_page_through_the_URL_cursor()
    {
        var page = await PageOf(api, Kind.Article);
        for (var i = page.TotalCount; i < 21; i++)
        {
            await CreatePublished(api, Kind.Article);
        }

        await Page.GotoAsync(ListPath(Kind.Article));
        await Next().First.ClickAsync();
        await Expect(Page).ToHaveURLAsync(new Regex(@"[?&]after="));
        await Expect(Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link).First).ToBeVisibleAsync();
    }

    private ILocator Next() =>
        Page.GetByRole(AriaRole.Link, new() { NameRegex = Rx("next|older|more") }).Or(Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("next|older|more") }));

    // The navigation underline is a centred 2px gradient whose width is the cue: drawn in full under the current link and on hover or
    // focus, zero width otherwise.
    private static Task<string> Underline(ILocator link) => link.EvaluateAsync<string>("""
        element => {
          const style = getComputedStyle(element);
          return style.backgroundImage.includes('gradient') ? style.backgroundSize : 'none';
        }
        """);

    // Page placement.

    private ILocator Tiles() => Page.GetByRole(AriaRole.Region, new() { Name = "Explore the site" }).GetByRole(AriaRole.Link);

    private ILocator NavLink(string slug) => Page.GetByRole(AriaRole.Navigation, new() { Name = "Main navigation" }).Locator($"a[href=\"/pages/{slug}\"]");

    [Fact]
    public async Task Pages_appear_in_the_navigation_and_as_home_tiles_only_as_placed_and_drafts_never_do()
    {
        await Home();
        var navOnly = await CreatePublished(api, Kind.Page, Input(("title", $"Nav only {Env.RunId}")));
        var tile = await CreatePublished(api, Kind.Page, Input(("title", $"Tiled {Env.RunId}"), ("featureOnHome", true), ("homeOrder", 0), ("accent", "ORANGE"), ("showInNavigation", false)));
        var draft = await CreateOk(api, Kind.Page, Input(("title", $"Placed draft {Env.RunId}"), ("featureOnHome", true), ("homeOrder", 0), ("accent", "BLUE")));
        await Page.GotoAsync("/");
        await Expect(NavLink(navOnly.Slug), "shown in the navigation").ToBeVisibleAsync();
        await Expect(Tiles().Filter(new() { HasText = navOnly.Title }), "not a tile").ToHaveCountAsync(0);
        await Expect(Tiles().Filter(new() { HasText = tile.Title }), "featured as a tile").ToHaveCountAsync(1);
        await Expect(NavLink(tile.Slug), "hidden from the navigation").ToHaveCountAsync(0);
        await Expect(NavLink(draft.Slug)).ToHaveCountAsync(0);
        await Expect(Tiles().Filter(new() { HasText = draft.Title }), "drafts are never tiles").ToHaveCountAsync(0);
    }

    [Fact]
    public async Task At_most_four_tiles_show_by_home_order_then_title()
    {
        await Home();
        // "A0 …" sorts before other tests' tiles at home order 0 (such as About).
        var titles = new[] { "A", "B", "C", "D", "E" }.Select(letter => $"A0 Cap {letter} {Env.RunId}").Reverse().ToList();
        foreach (var title in titles)
        {
            await CreatePublished(api, Kind.Page, Input(("title", title), ("featureOnHome", true), ("homeOrder", 0), ("accent", "GREEN")));
        }

        await Page.GotoAsync("/");
        await Expect(Tiles()).ToHaveCountAsync(4);
        var shown = await Tiles().AllTextContentsAsync();
        Assert.Equal(["Cap A", "Cap B", "Cap C", "Cap D"], shown.Select(text => CapPattern().Match(text).Value));
    }

    // Navigation.

    [Fact]
    public async Task Navigation_links_to_published_pages_only_News_and_Products_among_them()
    {
        await EnsurePage(api, "services", "PUBLISHED", Input(("title", "Services")));
        await EnsurePage(api, "about", "DRAFT", Input(("title", "About")));
        await HostPage(Kind.Article);
        await HostPage(Kind.Product);
        await Page.GotoAsync("/");
        await Expect(Page.Locator("nav a[href=\"/pages/services\"]").First).ToBeVisibleAsync();
        await Expect(Page.Locator("nav a[href=\"/pages/about\"]")).ToHaveCountAsync(0);
        await Expect(Page.Locator("nav a[href=\"/pages/news\"]").First).ToBeVisibleAsync();
        await Expect(Page.Locator("nav a[href=\"/pages/products\"]").First).ToBeVisibleAsync();
        await Expect(Page.Locator("nav a[href=\"/news\"], nav a[href=\"/products\"]"), "the old collection addresses").ToHaveCountAsync(0);
    }

    [Fact]
    public async Task The_navigation_marks_the_current_page_and_section()
    {
        await EnsurePage(api, "services", "PUBLISHED", Input(("title", "Services")));
        var post = await CreatePublished(api, Kind.Article);
        var nav = Page.GetByRole(AriaRole.Navigation, new() { Name = "Main navigation" });
        var current = nav.Locator("a[aria-current]");
        (string Path, string Href, string Value)[] cases =
        [
            ("/", "/", "page"),
            ("/pages/services", "/pages/services", "page"),
            (ListPath(Kind.Article), "/pages/news", "page"),
            (PublicPath(Kind.Article, post.Slug), "/pages/news", "true"),
        ];
        foreach (var (path, href, value) in cases)
        {
            await Page.GotoAsync(path);
            await Expect(current, $"{path}: one current link").ToHaveCountAsync(1);
            await Expect(current, path).ToHaveAttributeAsync("href", href);
            await Expect(current, path).ToHaveAttributeAsync("aria-current", value);
        }

        await Page.GotoAsync($"/pages/missing-{UniqueSlug()}");
        await Expect(current, "an unknown page matches no link").ToHaveCountAsync(0);
    }

    [Fact]
    public async Task The_current_page_is_marked_by_more_than_colour()
    {
        await EnsurePage(api, "services", "PUBLISHED", Input(("title", "Services")));
        await EnsurePage(api, "portfolio", "PUBLISHED", Input(("title", "Portfolio")));
        await Page.GotoAsync("/pages/services");
        var current = Page.GetByRole(AriaRole.Navigation, new() { Name = "Main navigation" }).Locator("a[aria-current=\"page\"]");
        var other = Page.GetByRole(AriaRole.Navigation, new() { Name = "Main navigation" }).Locator("a[href=\"/pages/portfolio\"]");
        await Page.Mouse.MoveAsync(0, 0);
        Assert.True(await Underline(current) == "100% 2px", "the current link keeps its underline drawn");
        Assert.True(await Underline(other) == "0% 2px", "other links are not underlined until hovered");
    }

    [Fact]
    public async Task The_home_icon_is_never_underlined_or_highlighted_even_at_home()
    {
        await Page.GotoAsync("/");
        var home = Page.GetByRole(AriaRole.Navigation, new() { Name = "Main navigation" }).Locator("a[href=\"/\"]");
        await Expect(home, "assistive technology still hears the current page").ToHaveAttributeAsync("aria-current", "page");
        await Page.Mouse.MoveAsync(0, 0);
        Assert.Equal("none", await Underline(home));
        Assert.True(await home.EvaluateAsync<string>("element => getComputedStyle(element).backgroundColor") == "rgba(0, 0, 0, 0)", "no current tint");
        await home.HoverAsync();
        Assert.True(await Underline(home) == "none", "not on hover either");
    }

    [Fact]
    public async Task Every_public_route_has_a_consistent_header_navigation_and_footer()
    {
        var post = await CreatePublished(api, Kind.Article);
        await HostPage(Kind.Product);
        foreach (var path in new[] { "/", ListPath(Kind.Article), ListPath(Kind.Product), PublicPath(Kind.Article, post.Slug), $"/pages/missing-{UniqueSlug()}" })
        {
            await Page.GotoAsync(path);
            await Expect(Page.GetByRole(AriaRole.Banner), $"{path} header").ToBeVisibleAsync();
            await Expect(Page.GetByRole(AriaRole.Navigation).First, $"{path} navigation").ToBeVisibleAsync();
            await Expect(Page.GetByRole(AriaRole.Contentinfo), $"{path} footer").ToBeVisibleAsync();
        }
    }

    // Navigation across list pages.

    [Fact]
    public async Task Later_pages_of_a_pages_items_keep_the_same_site_navigation()
    {
        // The navigation depends on which pages are published, not on how far through a page's items the visitor has paged.
        await HostPage(Kind.Product);
        var published = (await Walk(api, Kind.Article)).Nodes.Count(node => node.Status == "PUBLISHED");
        for (var i = published; i < 41; i++)
        {
            await CreatePublished(api, Kind.Article);
        }

        await Page.GotoAsync(ListPath(Kind.Article));
        var productsLink = Page.Locator("nav a[href=\"/pages/products\"]").First;
        await Expect(productsLink, "News links to Products").ToBeVisibleAsync();
        for (var step = 1; step <= 2; step++)
        {
            var url = Page.Url;
            await Next().First.ClickAsync();
            await Expect(Page).Not.ToHaveURLAsync(url);
            await Expect(Page).ToHaveURLAsync(new Regex(@"[?&]after="));
            await Expect(Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link).First).ToBeVisibleAsync();
            await Expect(productsLink, $"item page {step + 1} still links to Products").ToBeVisibleAsync();
        }
    }

    // Client-side routing.

    [Fact]
    public async Task Following_site_links_does_not_reload_the_document()
    {
        var post = await CreatePublished(api, Kind.Article);
        await Page.GotoAsync("/");
        await Page.EvaluateAsync("() => (window.__document = 'first-load')");
        Task<bool> SameDocument() => Page.EvaluateAsync<bool>("() => window.__document === 'first-load'");

        await Page.Locator("nav a[href=\"/pages/news\"]").First.ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}/pages/news");
        Assert.True(await SameDocument(), "navigation link handled by the router");

        await Page.GetByRole(AriaRole.Main).Locator($"a[href=\"{PublicPath(Kind.Article, post.Slug)}\"]").First.ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{PublicPath(Kind.Article, post.Slug)}");
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToHaveTextAsync(post.Title);
        Assert.True(await SameDocument(), "list link handled by the router");
    }

    // Whether a /graphql request body carries the named operation, by name or by its text.
    private static bool IsOperation(string? body, string name) =>
        Regex.IsMatch(body ?? string.Empty, $"\"operationName\":\"{name}\"|\\b(query|mutation) {name}\\b");

    [Fact]
    public async Task Hovering_a_link_before_following_it_fetches_the_route_query_once()
    {
        await CreatePublished(api, Kind.Article);
        static bool IsPageQuery(IRequest request) => new Uri(request.Url).AbsolutePath == "/graphql" && IsOperation(request.PostData, "PageQuery");
        var pageQueries = new List<IRequest>();
        Page.Request += (_, request) =>
        {
            if (IsPageQuery(request))
            {
                pageQueries.Add(request);
            }
        };
        await Page.GotoAsync("/");
        var link = Page.Locator("nav a[href=\"/pages/news\"]").First;
        await link.HoverAsync();
        // Let any hover preload finish before following the link.
        try
        {
            await Page.WaitForResponseAsync(response => IsPageQuery(response.Request), new() { Timeout = 3_000 });
        }
        catch (TimeoutException)
        {
        }

        await link.ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToHaveTextAsync("News");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);
        Assert.True(pageQueries.Count == 1, "one PageQuery request for one navigation");
    }

    [Fact]
    public async Task A_route_query_that_returns_errors_is_not_shown_as_missing_content()
    {
        // A resolver failure yields partial data: every route field null, plus errors.
        var post = await CreatePublished(api, Kind.Article);
        await Page.RouteAsync("**/graphql", async route =>
        {
            if (!IsOperation(route.Request.PostData, "PageItemQuery"))
            {
                await route.ContinueAsync();
                return;
            }

            var response = await route.FetchAsync();
            var data = JsonNode.Parse(await response.TextAsync())!["data"]!.AsObject();
            var nulled = new JsonObject();
            foreach (var field in data)
            {
                nulled[field.Key] = null;
            }

            var body = new JsonObject { ["data"] = nulled, ["errors"] = new JsonArray(new JsonObject { ["message"] = "Internal server error" }) };
            await route.FulfillAsync(new() { Response = response, Body = body.ToJsonString(), ContentType = "application/json" });
        });
        await Page.GotoAsync(ListPath(Kind.Article));
        await Page.GetByRole(AriaRole.Main).Locator($"a[href=\"{PublicPath(Kind.Article, post.Slug)}\"]").First.ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{PublicPath(Kind.Article, post.Slug)}");
        await Expect(Page.GetByText(Rx("error|went wrong|try again|could not")).First).ToBeVisibleAsync();
        await Expect(NotFound(Page)).ToHaveCountAsync(0);
        Assert.DoesNotMatch(Rx("not found"), await Page.TitleAsync());
    }

    // Document titles.

    [Fact]
    public async Task Pages_that_hold_items_and_the_sign_in_page_have_descriptive_titles()
    {
        await CreatePublished(api, Kind.Article);
        await CreatePublished(api, Kind.Product);
        (string Path, Regex Title)[] cases = [(ListPath(Kind.Article), RxCs(@"^News\b")), (ListPath(Kind.Product), RxCs(@"^Products\b")), ("/admin/login", RxCs(@"^Sign in\b"))];
        foreach (var (path, title) in cases)
        {
            await Page.GotoAsync(path);
            await Expect(Page, path).ToHaveTitleAsync(title);
        }
    }

    // Initial data.

    [Fact]
    public async Task Public_routes_render_from_inlined_data_without_a_GraphQL_request()
    {
        var post = await CreatePublished(api, Kind.Article);
        var product = await CreatePublished(api, Kind.Product);
        (string Path, string Heading)[] routes =
        [
            (PublicPath(Kind.Article, post.Slug), post.Title),
            (PublicPath(Kind.Product, product.Slug), product.Title),
            (ListPath(Kind.Article), "News"),
        ];
        foreach (var (path, heading) in routes)
        {
            var requests = new List<string>();
            void Listener(object? sender, IRequest request)
            {
                if (new Uri(request.Url).AbsolutePath == "/graphql")
                {
                    requests.Add($"{request.Method} {request.Url}");
                }
            }

            Page.Request += Listener;
            await Page.GotoAsync(path);
            await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToHaveTextAsync(heading);
            await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            Page.Request -= Listener;
            Assert.True(requests.Count == 0, $"{path} rendered without fetching its route query: {string.Join(", ", requests)}");
        }
    }

    [GeneratedRegex(@"Cap [A-E]")]
    private static partial Regex CapPattern();
}

// Readable in light and dark mode.
public abstract class ReadableTests : BrowserTest
{
    protected abstract ColorScheme Scheme { get; }

    protected override BrowserNewContextOptions ContextOptions() => new() { ColorScheme = Scheme };

    [Fact]
    public async Task Headings_body_text_links_and_buttons_meet_WCAG_AA_contrast()
    {
        // website.md: public and admin UI follow the system colour scheme legibly.
        await using var api = await Api.Operator();
        var post = await CreatePublished(api, Kind.Article);
        foreach (var path in new[] { "/", ListPath(Kind.Article), PublicPath(Kind.Article, post.Slug), "/admin/login" })
        {
            await Page.GotoAsync(path);
            var targets = new List<ILocator>
            {
                Page.GetByRole(AriaRole.Heading, new() { Level = 1 }),
                Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Link).First,
                Page.GetByRole(AriaRole.Contentinfo).Locator("p, a").First,
            };
            targets.Add(path == "/admin/login"
                ? Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("sign in|log in") })
                : Page.GetByRole(AriaRole.Main).Locator("p").First);
            foreach (var target in targets)
            {
                await Expect(target).ToBeVisibleAsync();
                var text = (await target.TextContentAsync())?.Trim() ?? string.Empty;
                var label = $"{path} {text[..Math.Min(30, text.Length)]}";
                Assert.True(await ContrastOf(target) >= 4.5, $"{label} contrast");
            }
        }
    }
}

public class ReadableInLightModeTests : ReadableTests
{
    protected override ColorScheme Scheme => ColorScheme.Light;
}

public class ReadableInDarkModeTests : ReadableTests
{
    protected override ColorScheme Scheme => ColorScheme.Dark;
}
