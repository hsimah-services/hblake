using System.Text.RegularExpressions;
using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Contents;
using static Hsimah.Acceptance.Lib.Ui;
using static Microsoft.Playwright.Assertions;

namespace Hsimah.Acceptance.Ui;

// The WordPress-style admin (spec/ui/admin.md): a sidebar of Pages and of each page that holds items (News, Products), at
// /admin/pages and /admin/items/<page>, a table of each type's records with view, edit and delete actions, an "Add new" form,
// relative timestamps with the absolute time available on hover, focus and to screen readers.
public class AdminShellTests : BrowserTest
{
    private Api api = null!;

    public override async ValueTask InitializeAsync()
    {
        await base.InitializeAsync();
        api = await Api.Operator();
        // The sidebar has a section for each page that holds items.
        await HostPage(Kind.Article);
        await HostPage(Kind.Product);
        await SignIn(Page);
    }

    public override async ValueTask DisposeAsync()
    {
        await api.DisposeAsync();
        await base.DisposeAsync();
    }

    private ILocator Sidebar() => Page.GetByRole(AriaRole.Navigation, new() { Name = "Administration" });

    private ILocator RowOf(string title) => Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Row).Filter(new() { HasText = title });

    // Lists page 20 records at a time in the API's order, so a new record may be on a later page of a busy test database: follow
    // "Next page" until its row appears.
    private async Task<ILocator> OpenListAt(Kind kind, string title)
    {
        await Page.GotoAsync(AdminPath(kind));
        for (var step = 0; step < 40; step++)
        {
            await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToBeVisibleAsync();
            var row = RowOf(title);
            if (await row.CountAsync() > 0)
            {
                return row;
            }

            var next = Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link, new() { NameRegex = Rx("^next$") });
            if (await next.CountAsync() == 0)
            {
                break;
            }

            // Load the next page directly, so each check sees a fully rendered list rather than the previous page while a
            // client-side transition is still loading.
            await Page.GotoAsync((await next.GetAttributeAsync("href"))!);
        }

        throw new InvalidOperationException($"no row for \"{title}\" in the {kind} list");
    }

    [Fact]
    public async Task A_page_that_holds_items_gets_its_own_sidebar_section_named_by_the_page()
    {
        var title = $"Notes {Env.RunId}";
        var slug = $"notes-{Env.RunId}".ToLowerInvariant();
        await CreateOk(api, Kind.Page, Input(("title", title), ("slug", slug), ("defaultItemKind", "Note")));
        await Page.GotoAsync("/admin");
        var link = Sidebar().GetByRole(AriaRole.Link, new() { NameRegex = new Regex($@"^{Regex.Escape(title)}\b") });
        await Expect(link).ToHaveAttributeAsync("href", $"/admin/items/{slug}");
        await link.ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToHaveTextAsync(title);
        await Expect(Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link, new() { NameRegex = Rx("^new note$") }).First).ToBeVisibleAsync();
    }

    [Fact]
    public async Task A_page_that_holds_no_items_has_no_section()
    {
        var row = await CreateOk(api, Kind.Page, Input(("title", $"Plain {Env.RunId}")));
        await Page.GotoAsync("/admin");
        await Expect(Sidebar().GetByRole(AriaRole.Link, new() { NameRegex = new Regex($"^Plain {Env.RunId}") })).ToHaveCountAsync(0);
        var response = await Page.GotoAsync($"/admin/items/{row.Slug}");
        Assert.True(response?.Status < 500);
        await Expect(Page.GetByText(Rx("not found")).First).ToBeVisibleAsync();
    }

    [Fact]
    public async Task The_sidebar_lists_the_content_types_and_marks_the_current_one()
    {
        await Page.GotoAsync(AdminPath(Kind.Article));
        foreach (var name in new[] { "Dashboard", "Pages", "News", "Products", "Settings" })
        {
            await Expect(Sidebar().GetByRole(AriaRole.Link, new() { NameRegex = new Regex($@"^{name}\b") }), name).ToBeVisibleAsync();
        }

        await Expect(Sidebar().GetByRole(AriaRole.Link, new() { NameRegex = new Regex(@"^News\b") })).ToHaveAttributeAsync("aria-current", "page");
        await Expect(Sidebar().Locator("a[aria-current=\"page\"]")).ToHaveCountAsync(1);
        await Sidebar().GetByRole(AriaRole.Link, new() { NameRegex = new Regex(@"^Pages\b") }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(Kind.Page)}");
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToHaveTextAsync("Pages");
    }

    [Theory]
    [InlineData(Kind.Page, "Title|Actions|Slug|Status|Updated")]
    [InlineData(Kind.Article, "Title|Actions|Slug|Status|Published|Updated")]
    [InlineData(Kind.Product, "Title|Actions|Slug|Status|Published|Updated")]
    public async Task Records_are_listed_in_a_table_with_the_specified_columns(Kind kind, string columns)
    {
        var row = await CreateOk(api, kind, Input(("title", $"Tabled {kind} {Env.RunId}")));
        var record = await OpenListAt(kind, row.Title);
        var headers = await Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Columnheader).AllTextContentsAsync();
        Assert.Equal(columns.Split('|'), headers.Select(header => header.Trim()));
        await Expect(record).ToHaveCountAsync(1);
        await Expect(record.GetByText(Rx("^draft$"))).ToBeVisibleAsync();
        await Expect(record.GetByRole(AriaRole.Link, new() { Name = row.Title, Exact = true })).ToHaveAttributeAsync("href", $"{AdminPath(kind)}/{Uri.EscapeDataString(row.Id)}");
    }

    [Fact]
    public async Task Timestamps_read_relatively_with_the_absolute_time_on_focus_and_for_screen_readers()
    {
        var row = await CreateOk(api, Kind.Article, Input(("title", $"Timed {Env.RunId}")));
        var record = await OpenListAt(Kind.Article, row.Title);
        var time = record.Locator("time").Last;
        await Expect(time).ToHaveAttributeAsync("datetime", new Regex(@"^\d{4}-\d{2}-\d{2}T"));
        await Expect(time).ToHaveTextAsync(Rx("now|second|minute|ago"));
        var year = DateTime.UtcNow.Year.ToString();
        await Expect(time, "screen readers hear the absolute time").ToHaveAttributeAsync("aria-label", new Regex(year));
        // Reach it with the keyboard: the row's Delete button, then Tab (status and an unset publication time are not Tab stops).
        await record.GetByRole(AriaRole.Button, new() { Name = $"Delete “{row.Title}”" }).FocusAsync();
        await Page.Keyboard.PressAsync("Tab");
        await Expect(time, "keyboard users can reach it").ToBeFocusedAsync();
        await Expect(record.GetByText(new Regex(year)), "focus shows the absolute time").ToBeVisibleAsync();
        // Move focus out of the timestamp (Tab may land on the copy button inside its card).
        await record.GetByRole(AriaRole.Link, new() { Name = row.Title, Exact = true }).FocusAsync();
        await Expect(record.GetByText(new Regex(year)), "and hides it when focus moves away").ToBeHiddenAsync();
    }

    [Fact]
    public async Task Each_row_opens_from_its_title_and_is_edited_or_deleted_from_its_own_actions_cell()
    {
        var row = await CreateOk(api, Kind.Article, Input(("title", $"Row actions {Env.RunId}")));
        await (await OpenListAt(Kind.Article, row.Title)).GetByRole(AriaRole.Link, new() { Name = row.Title, Exact = true }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(Kind.Article)}/{Uri.EscapeDataString(row.Id)}");
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToHaveTextAsync(row.Title);

        await (await OpenListAt(Kind.Article, row.Title)).GetByRole(AriaRole.Link, new() { Name = $"Edit “{row.Title}”" }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(Kind.Article)}/{Uri.EscapeDataString(row.Id)}/edit");
        await Expect(Page.GetByLabel("Title")).ToHaveValueAsync(row.Title);

        var remove = (await OpenListAt(Kind.Article, row.Title)).GetByRole(AriaRole.Button, new() { Name = $"Delete “{row.Title}”" });
        await remove.ClickAsync();
        var dialog = Page.GetByRole(AriaRole.Alertdialog).Or(Page.GetByRole(AriaRole.Dialog));
        await Expect(dialog).ToContainTextAsync(row.Title);
        await dialog.GetByRole(AriaRole.Button, new() { NameRegex = Rx("cancel") }).ClickAsync();
        await Expect(dialog).ToBeHiddenAsync();
        Assert.True(await ById(api, Kind.Article, row.Id) is not null, "cancelling keeps the record");

        await remove.ClickAsync();
        await dialog.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^delete$") }).ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Status).Filter(new() { HasTextRegex = Rx("deleted") }), "the deletion is announced").ToBeVisibleAsync();
        await Expect(Page, "deleting from the list stays on the list").ToHaveURLAsync(new Regex($@"^{Regex.Escape(Env.BaseUrl)}{Regex.Escape(AdminPath(Kind.Article))}(\?|$)"));
        await Expect(RowOf(row.Title)).ToHaveCountAsync(0);
        await Poll.Until(async () => await ById(api, Kind.Article, row.Id) is null, "the record was deleted");
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 }), "focus does not fall to the page").ToBeFocusedAsync();
    }

    [Fact]
    public async Task New_type_opens_an_empty_form_for_the_type()
    {
        // With no products the list shows a second "New product" link in its empty state; the toolbar link is the one under test.
        await CreateOk(api, Kind.Product);
        await Page.GotoAsync(AdminPath(Kind.Product));
        await Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link, new() { NameRegex = Rx("^new product$") }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(Kind.Product)}/new");
        await Expect(Page.GetByLabel("Title")).ToHaveValueAsync(string.Empty);
        await Expect(Page.GetByLabel("Enquiry URL")).ToBeVisibleAsync();
    }

    [Fact]
    public async Task On_a_phone_row_actions_stay_in_view_and_the_sidebar_opens_from_a_menu_button()
    {
        await Use(new BrowserNewContextOptions { ViewportSize = new ViewportSize { Width = 360, Height = 740 }, IsMobile = true, HasTouch = true });
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Article, Input(("title", $"Phone {Env.RunId}")));
        await OpenListAt(Kind.Article, row.Title);
        foreach (var name in new[] { $"Edit “{row.Title}”", $"Delete “{row.Title}”" })
        {
            var action = RowOf(row.Title).GetByRole(name.StartsWith("Delete", StringComparison.Ordinal) ? AriaRole.Button : AriaRole.Link, new() { Name = name });
            var box = await action.BoundingBoxAsync();
            Assert.True(box is not null, name);
            Assert.True(box!.X + box.Width <= 360, $"{name} is within the screen");
            Assert.True(box.Height >= 44, $"{name} touch target");
        }

        // AppShell moves the sidebar's items into the top bar's drawer on phones.
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("open navigation") }).ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Dialog).GetByRole(AriaRole.Link, new() { NameRegex = new Regex(@"^Products\b") })).ToBeVisibleAsync();
    }

    [Fact]
    public async Task Columns_sort_the_listed_records_and_say_how_they_are_sorted()
    {
        await CreateOk(api, Kind.Page, Input(("title", $"Sortable A {Env.RunId}")));
        await CreateOk(api, Kind.Page, Input(("title", $"Sortable B {Env.RunId}")));
        await Page.GotoAsync(AdminPath(Kind.Page));
        var header = Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Columnheader, new() { Name = "Sort by Title" });
        Task<IReadOnlyList<string>> Titles() => Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Row).Locator("td:first-child a").AllTextContentsAsync();
        // The page's own collation, as the TypeScript suite used (numeric, case-insensitive).
        Task<string[]> Collate(IEnumerable<string> values, bool descending) =>
            Page.EvaluateAsync<string[]>(
                "([values, descending]) => { const sorted = [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })); return descending ? sorted.reverse() : sorted; }",
                new object[] { values, descending });
        await header.GetByRole(AriaRole.Button, new() { Name = "Sort by Title" }).ClickAsync();
        await Expect(header).ToHaveAttributeAsync("aria-sort", "ascending");
        var ascending = (await Titles()).ToList();
        Assert.Equal(await Collate(ascending, false), ascending);
        await header.GetByRole(AriaRole.Button, new() { Name = "Sort by Title" }).ClickAsync();
        await Expect(header).ToHaveAttributeAsync("aria-sort", "descending");
        var descending = (await Titles()).ToList();
        Assert.Equal(await Collate(descending, true), descending);
    }

    [Fact]
    public async Task The_dashboard_draft_count_opens_the_list_filtered_to_drafts()
    {
        await CreateOk(api, Kind.Article, Input(("title", $"Filter draft {Env.RunId}")));
        await Page.GotoAsync("/admin");
        var drafts = Page.GetByRole(AriaRole.Main).Locator($"a[href=\"{AdminPath(Kind.Article)}?status=draft\"]");
        await Expect(drafts).ToHaveTextAsync(new Regex(@"^\d+ drafts?$"));
        await drafts.ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(Kind.Article)}?status=draft");
        await Expect(Page.GetByRole(AriaRole.Main).GetByText(Rx("showing drafts only"))).ToBeVisibleAsync();
        var statuses = await Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Row).Locator("td").Filter(new() { HasTextRegex = new Regex("^(Draft|Published)$") }).AllTextContentsAsync();
        Assert.True(statuses.Count > 0);
        Assert.Equal(["Draft"], statuses.Distinct());
        await Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link, new() { NameRegex = Rx("^show all news$") }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(Kind.Article)}");
    }

    [Fact]
    public async Task The_edit_screen_publishes_from_its_side_panel_only_once_changes_are_saved()
    {
        var row = await CreateOk(api, Kind.Page, Input(("title", $"Panel {Env.RunId}")));
        await Page.GotoAsync($"{AdminPath(Kind.Page)}/{Uri.EscapeDataString(row.Id)}/edit");
        var panel = Page.GetByRole(AriaRole.Complementary, new() { Name = "Publishing" });
        await Expect(panel.GetByText("Status: Draft")).ToBeVisibleAsync();
        await Page.GetByLabel("Title").FillAsync($"{row.Title} changed");
        await Expect(panel.GetByRole(AriaRole.Button, new() { Name = "Publish" }), "unsaved changes must be saved first").ToBeDisabledAsync();
        await Page.GetByLabel("Title").FillAsync(row.Title);
        await panel.GetByRole(AriaRole.Button, new() { Name = "Publish" }).ClickAsync();
        await Expect(panel.GetByText("Status: Published")).ToBeVisibleAsync();
        await Expect(panel.GetByRole(AriaRole.Button, new() { Name = "Unpublish" })).ToBeEnabledAsync();
        await Poll.Equals(async () => (await ById(api, Kind.Page, row.Id))?.Status, "PUBLISHED");
    }

    [Fact]
    public async Task Rows_publish_and_unpublish_from_their_actions_cell()
    {
        var row = await CreateOk(api, Kind.Product, Input(("title", $"Row publish {Env.RunId}")));
        var record = await OpenListAt(Kind.Product, row.Title);
        await record.GetByRole(AriaRole.Button, new() { Name = $"Publish “{row.Title}”" }).ClickAsync();
        await Expect(record.GetByRole(AriaRole.Button, new() { Name = $"Unpublish “{row.Title}”" })).ToBeVisibleAsync();
        await Expect(record.GetByText(new Regex("^Published$"))).ToBeVisibleAsync();
        await Expect(Page.GetByRole(AriaRole.Status).Filter(new() { HasTextRegex = Rx("published") })).ToBeVisibleAsync();
        await Poll.Equals(async () => (await ById(api, Kind.Product, row.Id))?.Status, "PUBLISHED");
    }

    [Fact]
    public async Task Status_links_and_title_search_narrow_the_list_through_the_URL()
    {
        await Page.GotoAsync($"{AdminPath(Kind.Page)}?status=draft");
        var filters = Page.GetByRole(AriaRole.Navigation, new() { Name = "Filter by status" });
        await Expect(filters.GetByRole(AriaRole.Link, new() { Name = "Drafts" })).ToHaveAttributeAsync("aria-current", "page");
        await Expect(filters.GetByRole(AriaRole.Link, new() { Name = "All" })).Not.ToHaveAttributeAsync("aria-current", "page");
        await filters.GetByRole(AriaRole.Link, new() { Name = "All" }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(Kind.Page)}");

        var first = await CreateOk(api, Kind.Page, Input(("title", $"Findable {Env.RunId}")));
        await Page.GotoAsync(AdminPath(Kind.Page));
        await Page.GetByRole(AriaRole.Search).GetByLabel("Search titles").FillAsync($"findable {Env.RunId}");
        await Page.GetByRole(AriaRole.Search).GetByRole(AriaRole.Button, new() { Name = "Search" }).ClickAsync();
        await Expect(Page).ToHaveURLAsync(new Regex(@"\?q="));
        await Expect(Page.GetByRole(AriaRole.Main).GetByText(Rx("matching"))).ToBeVisibleAsync();
        var titles = await Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Row).Locator("td:first-child a").AllTextContentsAsync();
        Assert.True(titles.All(title => title.Contains($"findable {Env.RunId}", StringComparison.OrdinalIgnoreCase)), string.Join(", ", titles));
        Assert.Contains("Findable", first.Title);
    }

    [Fact]
    public async Task The_dashboard_lists_recently_edited_records_newest_first()
    {
        var row = await CreateOk(api, Kind.Page, Input(("title", $"Recent {Env.RunId}")));
        await Page.GotoAsync("/admin");
        var recent = Page.GetByRole(AriaRole.Region, new() { Name = "Recently edited" });
        await Expect(recent.GetByRole(AriaRole.Listitem).First).ToContainTextAsync(row.Title);
        await recent.GetByRole(AriaRole.Link, new() { Name = row.Title }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(Kind.Page)}/{Uri.EscapeDataString(row.Id)}");
    }

    [Fact]
    public async Task The_page_form_places_a_page_in_the_navigation_and_on_the_home_page()
    {
        var row = await CreateOk(api, Kind.Page, Input(("title", $"Placed {Env.RunId}")));
        await Page.GotoAsync($"{AdminPath(Kind.Page)}/{Uri.EscapeDataString(row.Id)}/edit");
        var placement = Page.GetByRole(AriaRole.Group, new() { Name = "Placement" });
        await Expect(placement.GetByRole(AriaRole.Checkbox, new() { Name = "Show in navigation" })).ToBeCheckedAsync();
        await Expect(placement.GetByRole(AriaRole.Checkbox, new() { Name = "Feature on home page" })).Not.ToBeCheckedAsync();
        await placement.GetByRole(AriaRole.Checkbox, new() { Name = "Show in navigation" }).UncheckAsync();
        await placement.GetByRole(AriaRole.Checkbox, new() { Name = "Feature on home page" }).CheckAsync();
        await Page.GetByRole(AriaRole.Button, new() { Name = "Save" }).ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Alert).Filter(new() { HasText = "correct the highlighted fields" }), "a featured page needs a colour").ToBeVisibleAsync();
        await Expect(placement.GetByRole(AriaRole.Radiogroup, new() { Name = "Colour" }).GetByRole(AriaRole.Radio, new() { NameRegex = new Regex("^None") })).ToBeFocusedAsync();
        await placement.GetByRole(AriaRole.Radio, new() { Name = "Orange" }).CheckAsync();
        await placement.GetByRole(AriaRole.Spinbutton, new() { Name = "Home order" }).FillAsync("7");
        await placement.GetByRole(AriaRole.Spinbutton, new() { Name = "Home order" }).PressAsync("Tab");
        await Page.GetByRole(AriaRole.Button, new() { Name = "Save" }).ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Status).Filter(new() { HasText = "Saved successfully." })).ToBeVisibleAsync();
        var saved = (await api.Ok("query($id: ID!) { page(id: $id) { showInNavigation featureOnHome homeOrder accent } }", new { id = row.Id }))["page"]!;
        Assert.False(saved["showInNavigation"]!.GetValue<bool>());
        Assert.True(saved["featureOnHome"]!.GetValue<bool>());
        Assert.Equal(7, saved["homeOrder"]!.GetValue<int>());
        Assert.Equal("ORANGE", saved["accent"]!.GetValue<string>());
    }
}
