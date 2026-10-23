using System.Text.RegularExpressions;
using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Contents;
using static Hsimah.Acceptance.Lib.Ui;
using static Microsoft.Playwright.Assertions;

namespace Hsimah.Acceptance.Ui;

// Content administration (ui/admin.md, ui/admin.yml, acceptance 7). Field labels follow admin.yml: Title, Slug, Content, Excerpt
// and, for items, Enquiry URL and Kind. The items of a page are administered at /admin/items/<page slug>.
public partial class AdminTests : BrowserTest
{
    private Api api = null!;

    public override async ValueTask InitializeAsync()
    {
        await base.InitializeAsync();
        api = await Api.Operator();
        await HostPage(Kind.Article);
        await HostPage(Kind.Product);
    }

    public override async ValueTask DisposeAsync()
    {
        await api.DisposeAsync();
        await base.DisposeAsync();
    }

    // Content is written as rich text (editor tests); its Markdown mode is the plain Content textarea these tests type raw Markdown into.
    private Task MarkdownSource() => Page.GetByRole(AriaRole.Radio, new() { Name = "Markdown" }).ClickAsync();

    private string IdFromUrl(Kind kind)
    {
        var match = Regex.Match(new Uri(Page.Url).AbsolutePath, $"^{Regex.Escape(AdminPath(kind))}/([^/]+)$");
        Assert.True(match.Success, $"on a {kind} detail URL, got {Page.Url}");
        return Uri.UnescapeDataString(match.Groups[1].Value);
    }

    private ILocator SaveOrCreate() => Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^(save|create)") });

    private ILocator Save() => Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^save") });

    // Access.

    [Fact]
    public async Task Signed_out_visitors_are_sent_to_the_login_page()
    {
        foreach (var path in new[] { "/admin", "/admin/pages", "/admin/items/news/new", "/admin/items/products" })
        {
            await Page.GotoAsync(path);
            await Expect(Page, path).ToHaveURLAsync($"{Env.BaseUrl}/admin/login");
        }
    }

    [Fact]
    public async Task A_wrong_password_shows_an_announced_error_and_keeps_the_visitor_on_the_login_page()
    {
        await Page.GotoAsync("/admin/login");
        await Page.GetByLabel("Username").FillAsync(Env.Username);
        await Page.GetByLabel("Password").FillAsync($"{Env.Password}-wrong");
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("sign in|log in") }).ClickAsync();
        await Expect(AnnouncedError(Page)).ToBeVisibleAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}/admin/login");
        await Expect(Page.GetByLabel("Username")).ToHaveValueAsync(Env.Username);
    }

    [Fact]
    public async Task Signing_in_with_the_keyboard_reaches_the_admin_home_with_every_section_linked()
    {
        await Page.GotoAsync("/admin/login");
        await Page.GetByLabel("Username").FocusAsync();
        await Page.Keyboard.TypeAsync(Env.Username);
        await TabTo(Page, Page.GetByLabel("Password"));
        await Page.Keyboard.TypeAsync(Env.Password);
        await Page.Keyboard.PressAsync("Enter");
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}/admin");
        var main = Page.GetByRole(AriaRole.Main);
        foreach (var href in new[] { "/admin/pages", "/admin/items/news", "/admin/items/products" })
        {
            await Expect(main.Locator($"a[href=\"{href}\"]").First).ToBeVisibleAsync();
        }

        var viewer = (await api.Viewer())!["id"]!.GetValue<string>();
        await Expect(main.Locator($"a[href=\"/admin/users/{Uri.EscapeDataString(viewer)}\"], a[href=\"/admin/users/{viewer}\"]").First).ToBeVisibleAsync();
    }

    private static Task<string?[]> ControlNames(ILocator group) =>
        group.Locator("a, button").EvaluateAllAsync<string?[]>("controls => controls.map(control => control.getAttribute('aria-label') ?? control.textContent?.trim())");

    [Fact]
    public async Task Signed_in_the_header_groups_dark_mode_animations_Admin_or_View_site_and_Sign_out()
    {
        await SignIn(Page);
        await Page.GotoAsync("/");
        var group = Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Group, new() { Name = "Display and account" });
        var names = await ControlNames(group);
        Assert.Equal(4, names.Length);
        Assert.Matches(Rx("switch to (dark|light) mode"), names[0]!);
        Assert.Matches(Rx("turn (on|off) animations"), names[1]!);
        Assert.Equal("Admin", names[2]);
        Assert.Equal("Sign out", names[3]);
        await group.GetByRole(AriaRole.Link, new() { Name = "Admin" }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}/admin");
        // The admin's group is the inverse: View site in place of Admin.
        var adminGroup = Page.GetByRole(AriaRole.Banner).GetByRole(AriaRole.Group, new() { Name = "Display and account" });
        var adminNames = await ControlNames(adminGroup);
        Assert.Equal(4, adminNames.Length);
        Assert.Matches(Rx("switch to (dark|light) mode"), adminNames[0]!);
        Assert.Matches(Rx("turn (on|off) animations"), adminNames[1]!);
        Assert.Equal("View site", adminNames[2]);
        Assert.Equal("Sign out", adminNames[3]);
        await adminGroup.GetByRole(AriaRole.Link, new() { Name = "View site" }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}/");
    }

    [Fact]
    public async Task Signing_out_ends_the_session()
    {
        await SignIn(Page);
        await Page.GotoAsync("/admin");
        await Expect(Page.GetByRole(AriaRole.Group, new() { Name = "Display and account" }).GetByRole(AriaRole.Button, new() { Name = "Sign out" }), "sign out sits in the header group").ToBeVisibleAsync();
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("sign out|log out") }).Or(Page.GetByRole(AriaRole.Link, new() { NameRegex = Rx("sign out|log out") })).First.ClickAsync();
        await Page.GotoAsync("/admin/pages");
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}/admin/login");
    }

    // Administration of each kind.

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Create_works_by_keyboard_and_lands_on_a_draft_detail_view(Kind kind)
    {
        await SignIn(Page);
        var slug = UniqueSlug($"ui-{kind.ToString().ToLowerInvariant()}");
        await Page.GotoAsync($"{AdminPath(kind)}/new");
        await Page.GetByLabel("Title").FocusAsync();
        await Page.Keyboard.TypeAsync($"Keyboard {slug}");
        await TabTo(Page, Page.GetByLabel("Slug"));
        await Page.Keyboard.PressAsync("Control+a");
        await Page.Keyboard.TypeAsync(slug);
        await TabTo(Page, Page.GetByLabel("Content"));
        await Page.Keyboard.TypeAsync("Written by keyboard.");
        await TabTo(Page, Page.GetByLabel("Excerpt"));
        await Page.Keyboard.TypeAsync("Keyboard excerpt.");
        await TabTo(Page, SaveOrCreate(), 20);
        await Page.Keyboard.PressAsync("Enter");

        await Expect(Confirmation(Page)).ToBeVisibleAsync();
        var id = IdFromUrl(kind);
        await Expect(Page.GetByRole(AriaRole.Main).GetByText($"Keyboard {slug}").First).ToBeVisibleAsync();
        await Expect(Page.GetByRole(AriaRole.Main).GetByText(Rx("draft")).First).ToBeVisibleAsync();
        var row = await ById(api, kind, id);
        Assert.Equal(slug, row?.Slug);
        Assert.Equal("DRAFT", row?.Status);
        Assert.Equal("Written by keyboard.", row?.Body);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Forms_accept_only_the_allowlisted_fields(Kind kind)
    {
        await SignIn(Page);
        string[] expected = IsItem(kind) ? ["Title", "Slug", "Content", "Excerpt", "Enquiry URL", "Kind"] : ["Title", "Slug", "Content", "Excerpt", "Item kind"];
        var row = await CreateOk(api, kind);
        foreach (var path in new[] { $"{AdminPath(kind)}/new", $"{AdminPath(kind)}/{Uri.EscapeDataString(row.Id)}/edit" })
        {
            await Page.GotoAsync(path);
            foreach (var label in expected)
            {
                await Expect(Page.GetByLabel(label).First, $"{path} {label}").ToBeVisibleAsync();
            }

            await MarkdownSource();
            await Expect(Page.GetByLabel("Content").First).ToHaveJSPropertyAsync("tagName", "TEXTAREA");
            await Expect(ForbiddenControls(Page), $"{path} has no status, timestamp or id inputs").ToHaveCountAsync(0);
        }
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Validation_errors_are_announced_focus_the_first_invalid_field_and_keep_input(Kind kind)
    {
        await SignIn(Page);
        await Page.GotoAsync($"{AdminPath(kind)}/new");
        var title = $"Invalid {Env.RunId}";
        await Page.GetByLabel("Title").FillAsync(title);
        await Page.GetByLabel("Slug").FillAsync("Not A Valid Slug");
        await MarkdownSource();
        await Page.GetByLabel("Content").FillAsync("Some body text.");
        await SaveOrCreate().ClickAsync();

        await Expect(AnnouncedError(Page).First).ToBeVisibleAsync();
        await Expect(Page.GetByLabel("Slug")).ToHaveAttributeAsync("aria-invalid", "true");
        await Expect(Page.GetByLabel("Slug")).ToBeFocusedAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(kind)}/new");
        await Expect(Page.GetByLabel("Title")).ToHaveValueAsync(title);
        await Expect(Page.GetByLabel("Slug")).ToHaveValueAsync("Not A Valid Slug");
        await Expect(Page.GetByLabel("Content")).ToHaveValueAsync("Some body text.");
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Server_side_rejections_keep_input_too(Kind kind)
    {
        await SignIn(Page);
        var taken = await CreateOk(api, kind);
        await Page.GotoAsync($"{AdminPath(kind)}/new");
        await Page.GetByLabel("Title").FillAsync($"Duplicate {Env.RunId}");
        await Page.GetByLabel("Slug").FillAsync(taken.Slug);
        await MarkdownSource();
        await Page.GetByLabel("Content").FillAsync("Duplicate slug body.");
        await SaveOrCreate().ClickAsync();
        await Expect(AnnouncedError(Page).First).ToBeVisibleAsync();
        await Expect(Page.GetByLabel("Title")).ToHaveValueAsync($"Duplicate {Env.RunId}");
        await Expect(Page.GetByLabel("Content")).ToHaveValueAsync("Duplicate slug body.");
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task The_Markdown_preview_renders_safely(Kind kind)
    {
        await SignIn(Page);
        await Page.GotoAsync($"{AdminPath(kind)}/new");
        await MarkdownSource();
        await Page.GetByLabel("Content").FillAsync($"## Preview {Env.RunId}\n\n<img src=x onerror=\"window.__xss=1\"><script>window.__xss=2</script>");
        var toggle = Page.GetByRole(AriaRole.Tab, new() { NameRegex = Rx("preview") }).Or(Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("preview") }));
        if (await toggle.CountAsync() > 0)
        {
            await toggle.First.ClickAsync();
        }

        await Expect(Page.GetByRole(AriaRole.Heading, new() { Name = $"Preview {Env.RunId}" })).ToBeVisibleAsync();
        Assert.False(await XssFired(Page));
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Edit_saves_changes_and_shows_a_confirmation(Kind kind)
    {
        await SignIn(Page);
        var row = await CreateOk(api, kind);
        await Page.GotoAsync($"{AdminPath(kind)}/{Uri.EscapeDataString(row.Id)}/edit");
        await Expect(Page.GetByLabel("Title")).ToHaveValueAsync(row.Title);
        await Page.GetByLabel("Title").FillAsync($"{row.Title} edited");
        await Save().ClickAsync();
        await Expect(Confirmation(Page)).ToBeVisibleAsync();
        await Poll.Equals(async () => (await ById(api, kind, row.Id))?.Title, $"{row.Title} edited");
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Publish_and_unpublish_are_separate_actions_on_the_detail_view(Kind kind)
    {
        await SignIn(Page);
        var row = await CreateOk(api, kind);
        await Page.GotoAsync($"{AdminPath(kind)}/{Uri.EscapeDataString(row.Id)}");
        await Expect(Page.GetByRole(AriaRole.Textbox)).ToHaveCountAsync(0);
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^publish$") }).ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^unpublish$") })).ToBeVisibleAsync();
        await Expect(Page.GetByRole(AriaRole.Main).GetByText(Rx("published")).First).ToBeVisibleAsync();
        await Poll.Equals(async () => (await ById(api, kind, row.Id))?.Status, "PUBLISHED");

        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^unpublish$") }).ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^publish$") })).ToBeVisibleAsync();
        await Poll.Equals(async () => (await ById(api, kind, row.Id))?.Status, "DRAFT");
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Delete_asks_for_confirmation_cancelling_keeps_the_record(Kind kind)
    {
        await SignIn(Page);
        var row = await CreateOk(api, kind);
        await Page.GotoAsync($"{AdminPath(kind)}/{Uri.EscapeDataString(row.Id)}");
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^delete") }).ClickAsync();
        var dialog = Page.GetByRole(AriaRole.Alertdialog).Or(Page.GetByRole(AriaRole.Dialog));
        await Expect(dialog).ToBeVisibleAsync();
        await dialog.GetByRole(AriaRole.Button, new() { NameRegex = Rx("cancel|keep|no") }).ClickAsync();
        await Expect(dialog).ToBeHiddenAsync();
        Assert.NotNull(await ById(api, kind, row.Id));

        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^delete") }).ClickAsync();
        await dialog.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^(delete|confirm|yes)") }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(kind)}");
        await Poll.Until(async () => await ById(api, kind, row.Id) is null, "the record was deleted");
        await Expect(Page.GetByRole(AriaRole.Main).GetByText(row.Title)).ToHaveCountAsync(0);
    }

    // Forms in detail.

    [Fact]
    public async Task A_new_records_slug_follows_its_title_until_the_slug_is_edited()
    {
        await SignIn(Page);
        await Page.GotoAsync("/admin/pages/new");
        var title = Page.GetByLabel("Title");
        var slug = Page.GetByLabel("Slug");
        await title.FillAsync("Hello, World! It's 2026 — Café & Co.");
        await Expect(slug, "kebab case, accents folded, punctuation dropped").ToHaveValueAsync("hello-world-its-2026-cafe-co");
        await title.FillAsync($"{string.Concat(Enumerable.Repeat("Long words ", 30))}end");
        await Expect(slug).ToHaveValueAsync(new Regex("^[a-z0-9]+(?:-[a-z0-9]+)*$"));
        Assert.True((await slug.InputValueAsync()).Length <= 160, "within the slug limit");

        await slug.FillAsync("chosen-slug");
        await title.FillAsync("A different title");
        await Expect(slug, "an edited slug stays").ToHaveValueAsync("chosen-slug");
        await slug.FillAsync(string.Empty);
        await title.FillAsync("Back to automatic");
        await Expect(slug, "clearing it resumes following").ToHaveValueAsync("back-to-automatic");
    }

    [Fact]
    public async Task Editing_a_title_never_changes_an_existing_slug()
    {
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Page);
        await Page.GotoAsync($"/admin/pages/{Uri.EscapeDataString(row.Id)}/edit");
        await Page.GetByLabel("Title").FillAsync("Renamed without moving");
        await Expect(Page.GetByLabel("Slug")).ToHaveValueAsync(row.Slug);
    }

    [Fact]
    public async Task An_enquiry_URL_can_be_cleared()
    {
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Product, Input(("enquiryUrl", "https://example.com/clear-me")));
        await Page.GotoAsync($"/admin/items/products/{Uri.EscapeDataString(row.Id)}/edit");
        await Expect(Page.GetByLabel("Enquiry URL")).ToHaveValueAsync("https://example.com/clear-me");
        await Page.GetByLabel("Enquiry URL").FillAsync(string.Empty);
        await Save().ClickAsync();
        await Expect(Confirmation(Page)).ToBeVisibleAsync();
        await Poll.Until(async () => (await ById(api, Kind.Product, row.Id))?.EnquiryUrl is null, "the enquiry URL was cleared");
    }

    [Fact]
    public async Task An_excerpt_can_be_cleared_without_touching_other_fields()
    {
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Article, Input(("excerpt", "Remove me.")));
        await Page.GotoAsync($"/admin/items/news/{Uri.EscapeDataString(row.Id)}/edit");
        await Page.GetByLabel("Excerpt").FillAsync(string.Empty);
        await Save().ClickAsync();
        await Expect(Confirmation(Page)).ToBeVisibleAsync();
        await Poll.Until(async () =>
        {
            var after = await ById(api, Kind.Article, row.Id);
            return after?.Excerpt == string.Empty && after.Title == row.Title && after.Body == row.Body;
        }, "only the excerpt was cleared");
    }

    [Fact]
    public async Task A_refused_write_explains_itself_without_transport_details_and_keeps_input()
    {
        // A stale CSRF token makes the real server answer 403 (tests/README.md, HTTP contract).
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Page);
        await Page.GotoAsync($"/admin/pages/{Uri.EscapeDataString(row.Id)}/edit");
        await Page.RouteAsync("**/auth/csrf", route => route.FulfillAsync(new() { Body = $"{{\"token\":\"stale-{Env.RunId}\"}}", ContentType = "application/json" }));
        await Page.GetByLabel("Title").FillAsync($"{row.Title} refused");
        await Save().ClickAsync();
        var error = AnnouncedError(Page).First;
        await Expect(error).ToHaveTextAsync(new Regex(@"\w"));
        await Expect(error).Not.ToHaveTextAsync(Rx(@"graphql|request failed|\b403\b"));
        await Expect(Page.GetByLabel("Title")).ToHaveValueAsync($"{row.Title} refused");
        Assert.Equal(row.Title, (await ById(api, Kind.Page, row.Id))?.Title);
    }

    [Fact]
    public async Task The_edit_screen_explains_that_changing_the_slug_changes_the_URL()
    {
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Page);
        await Page.GotoAsync($"/admin/pages/{Uri.EscapeDataString(row.Id)}/edit");
        await Expect(Page.GetByText(Rx("url")).Filter(new() { HasTextRegex = Rx("chang") }).First).ToBeVisibleAsync();
    }

    [Fact]
    public async Task A_dirty_form_warns_before_navigating_away()
    {
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Page);
        var editUrl = $"{Env.BaseUrl}/admin/pages/{Uri.EscapeDataString(row.Id)}/edit";
        await Page.GotoAsync(editUrl);
        await Page.GetByLabel("Title").FillAsync($"{row.Title} unsaved");

        var nativePrompt = false;
        void OnDialog(object? sender, IDialog dialog)
        {
            nativePrompt = true;
            _ = dialog.DismissAsync();
        }

        Page.Dialog += OnDialog;
        await Page.Locator("a[href=\"/admin\"], a[href=\"/admin/pages\"]").First.ClickAsync();
        var inAppPrompt = Page.GetByRole(AriaRole.Alertdialog).Or(Page.GetByRole(AriaRole.Dialog));
        await Poll.Until(async () => nativePrompt || await inAppPrompt.CountAsync() > 0, "a prompt warned about unsaved changes", 5_000);
        if (!nativePrompt)
        {
            await inAppPrompt.GetByRole(AriaRole.Button, new() { NameRegex = Rx("stay|cancel|keep") }).ClickAsync();
        }

        await Expect(Page).ToHaveURLAsync(editUrl);
        await Expect(Page.GetByLabel("Title")).ToHaveValueAsync($"{row.Title} unsaved");
    }

    [Fact]
    public async Task Admin_lists_page_in_bounded_steps_with_the_cursor_in_the_URL()
    {
        await SignIn(Page);
        var existing = await PageOf(api, Kind.Article);
        for (var i = existing.TotalCount; i < 21; i++)
        {
            await CreateOk(api, Kind.Article);
        }

        await Page.GotoAsync("/admin/items/news");
        var records = Page.GetByRole(AriaRole.Main).Locator("a[href^=\"/admin/items/news/\"]");
        await Expect(records.First).ToBeVisibleAsync();
        var ids = await records.EvaluateAllAsync<string[]>("links => [...new Set(links.map(link => link.getAttribute('href').split('/')[4]).filter(id => id && id !== 'new'))]");
        Assert.True(ids.Length <= 20, "at most 20 records per page");
        Assert.True(ids.Length > 0);
        await Page.GetByRole(AriaRole.Link, new() { NameRegex = Rx("next|older|more") }).Or(Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("next|older|more") })).First.ClickAsync();
        await Expect(Page).ToHaveURLAsync(new Regex(@"/admin/items/news\?(.*&)?after="));
    }

    [Fact]
    public async Task Records_created_in_the_admin_are_not_public_until_published()
    {
        await SignIn(Page);
        var slug = UniqueSlug("ui-private");
        await Page.GotoAsync("/admin/items/news/new");
        await Page.GetByLabel("Title").FillAsync($"Private {slug}");
        await Page.GetByLabel("Slug").FillAsync(slug);
        await MarkdownSource();
        await Page.GetByLabel("Content").FillAsync("Not yet.");
        await SaveOrCreate().ClickAsync();
        await Expect(Confirmation(Page)).ToBeVisibleAsync();
        await using var anonymous = await Api.Anonymous();
        Assert.Null(await BySlug(anonymous, Kind.Article, slug));
    }

    // Items in the admin.

    [Fact]
    public async Task A_new_item_is_attached_to_the_page_of_its_section_and_defaults_to_the_pages_kind()
    {
        await SignIn(Page);
        var slug = UniqueSlug("ui-kind");
        await Page.GotoAsync("/admin/items/products/new");
        await Expect(Page.GetByLabel("Kind")).ToHaveValueAsync("Product");
        await Page.GetByLabel("Title").FillAsync($"Kinded {slug}");
        await Page.GetByLabel("Slug").FillAsync(slug);
        await SaveOrCreate().ClickAsync();
        await Expect(Confirmation(Page)).ToBeVisibleAsync();
        var row = await BySlug(api, Kind.Product, slug);
        Assert.Equal("Product", row?.ItemKind);
        Assert.Equal("products", row?.PageSlug);
    }

    [Fact]
    public async Task The_kind_of_an_item_can_be_changed_to_another_kind_of_the_same_page()
    {
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Article);
        await Page.GotoAsync($"/admin/items/news/{Uri.EscapeDataString(row.Id)}/edit");
        await Page.GetByLabel("Kind").FillAsync("Case study");
        await Save().ClickAsync();
        await Expect(Confirmation(Page)).ToBeVisibleAsync();
        await Poll.Equals(async () => (await ById(api, Kind.Article, row.Id))?.ItemKind, "Case study");
    }

    [Fact]
    public async Task A_page_chooses_the_kind_of_item_it_holds()
    {
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Page);
        await Page.GotoAsync($"/admin/pages/{Uri.EscapeDataString(row.Id)}/edit");
        await Expect(Page.GetByLabel("Item kind")).ToHaveValueAsync(string.Empty);
        await Page.GetByLabel("Item kind").FillAsync("Framework");
        await Save().ClickAsync();
        await Expect(Confirmation(Page)).ToBeVisibleAsync();
        var saved = await api.Ok("query($id: ID!) { page(id: $id) { defaultItemKind } }", new { id = row.Id });
        Assert.Equal("Framework", saved["page"]!["defaultItemKind"]!.GetValue<string>());
        await Page.GotoAsync("/admin");
        await Expect(Page.GetByRole(AriaRole.Navigation, new() { Name = "Administration" }).GetByRole(AriaRole.Link, new() { NameRegex = new Regex($"^{Regex.Escape(row.Title)}") })).ToBeVisibleAsync();
    }

    [Fact]
    public async Task The_author_is_shown_on_records_and_is_not_an_editable_field()
    {
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Article);
        await Page.GotoAsync($"/admin/items/news/{Uri.EscapeDataString(row.Id)}");
        await Expect(Page.GetByRole(AriaRole.Main).GetByText(Env.DisplayName).First).ToBeVisibleAsync();
        await Page.GotoAsync($"/admin/items/news/{Uri.EscapeDataString(row.Id)}/edit");
        await Expect(Page.GetByLabel("Author")).ToHaveCountAsync(0);
    }

    // Dialogs and routing.

    [Fact]
    public async Task The_delete_confirmation_is_a_modal_dialog()
    {
        // WAI-ARIA modal dialog pattern: focus moves in, stays in, Escape closes, focus returns.
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Article);
        await Page.GotoAsync($"{AdminPath(Kind.Article)}/{Uri.EscapeDataString(row.Id)}");
        var trigger = Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^delete") });
        await trigger.FocusAsync();
        await Page.Keyboard.PressAsync("Enter");
        var dialog = Page.GetByRole(AriaRole.Alertdialog).Or(Page.GetByRole(AriaRole.Dialog));
        await Expect(dialog).ToBeVisibleAsync();
        Task<bool> FocusInDialog() => dialog.EvaluateAsync<bool>("element => element.contains(document.activeElement)");

        await Poll.Equals(FocusInDialog, true);
        for (var i = 0; i < 6; i++)
        {
            await Page.Keyboard.PressAsync("Tab");
            Assert.True(await FocusInDialog(), $"focus stays in the dialog after Tab {i + 1}");
        }

        for (var i = 0; i < 6; i++)
        {
            await Page.Keyboard.PressAsync("Shift+Tab");
            Assert.True(await FocusInDialog(), $"focus stays in the dialog after Shift+Tab {i + 1}");
        }

        await Page.Keyboard.PressAsync("Escape");
        await Expect(dialog, "Escape closes the dialog").ToBeHiddenAsync();
        await Expect(trigger, "focus returns to the Delete button").ToBeFocusedAsync();
        Assert.True(await ById(api, Kind.Article, row.Id) is not null, "Escape deletes nothing");
    }

    [Fact]
    public async Task Admin_links_do_not_reload_the_document()
    {
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Article);
        await Page.GotoAsync("/admin");
        await Page.EvaluateAsync("() => (window.__document = 'first-load')");
        Task<bool> SameDocument() => Page.EvaluateAsync<bool>("() => window.__document === 'first-load'");

        await Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link, new() { NameRegex = Rx("^news$") }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(Kind.Article)}");
        Assert.True(await SameDocument(), "section link handled by the router");

        await Page.GotoAsync($"{AdminPath(Kind.Article)}/{Uri.EscapeDataString(row.Id)}");
        await Page.EvaluateAsync("() => (window.__document = 'first-load')");
        await Page.GetByRole(AriaRole.Link, new() { NameRegex = Rx("^edit$") }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{AdminPath(Kind.Article)}/{Uri.EscapeDataString(row.Id)}/edit");
        await Expect(Page.GetByLabel("Title")).ToHaveValueAsync(row.Title);
        Assert.True(await SameDocument(), "edit link handled by the router");
    }

    // Document titles.

    [Fact]
    public async Task Admin_screens_are_titled_for_what_they_show_never_Not_found()
    {
        await SignIn(Page);
        var row = await CreateOk(api, Kind.Article);
        (string Path, Regex Title)[] screens =
        [
            ("/admin", RxCs(@"^Dashboard\b")),
            ("/admin/pages", RxCs(@"^Pages\b")),
            ("/admin/items/news", RxCs(@"^News\b")),
            ("/admin/items/products", RxCs(@"^Products\b")),
            ("/admin/items/news/new", RxCs(@"^New article\b")),
            ($"/admin/items/news/{Uri.EscapeDataString(row.Id)}", new Regex($@"^{Regex.Escape(row.Title)}\b")),
            ($"/admin/items/news/{Uri.EscapeDataString(row.Id)}/edit", new Regex($@"^Edit {Regex.Escape(row.Title)}\b")),
        ];
        foreach (var (path, title) in screens)
        {
            await Page.GotoAsync(path);
            await Expect(Page.GetByRole(AriaRole.Heading, new() { Level = 1 })).ToBeVisibleAsync();
            await Expect(Page, path).ToHaveTitleAsync(title);
        }
    }
}
