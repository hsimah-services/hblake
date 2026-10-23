using System.Text.RegularExpressions;
using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Contents;
using static Hsimah.Acceptance.Lib.Ui;
using static Microsoft.Playwright.Assertions;

namespace Hsimah.Acceptance.Ui;

// Rich-text articles (spec/ui/admin.md, issue #14): item content is edited as rich text with a formatting toolbar, or as Markdown
// source; Markdown stays the stored format. Images are uploaded from the editor and need alt text.
public partial class EditorTests : BrowserTest
{
    private Api api = null!;

    public override async ValueTask InitializeAsync()
    {
        await base.InitializeAsync();
        api = await Api.Operator();
        // The admin lists a section for each page that holds items.
        await HostPage(Kind.Article);
        await HostPage(Kind.Product);
        await SignIn(Page);
    }

    public override async ValueTask DisposeAsync()
    {
        await api.DisposeAsync();
        await base.DisposeAsync();
    }

    private ILocator Editor() => Page.GetByRole(AriaRole.Textbox, new() { Name = "Content" });

    private ILocator Toolbar() => Page.GetByRole(AriaRole.Toolbar, new() { Name = "Formatting" });

    private ILocator Mode(string name) => Page.GetByRole(AriaRole.Radio, new() { Name = name });

    private async Task<string> Markdown()
    {
        await Mode("Markdown").ClickAsync();
        var source = await Page.GetByLabel("Content").InputValueAsync();
        await Mode("Rich text").ClickAsync();
        return source;
    }

    private ILocator ToolbarButton(string name) => Toolbar().GetByRole(AriaRole.Button, new() { Name = name, Exact = true });

    private static readonly FilePayload Square = new() { Name = "square.png", MimeType = "image/png", Buffer = Images.Png };

    [Fact]
    public async Task Post_content_is_a_labelled_rich_text_editor_with_a_named_formatting_toolbar()
    {
        await Page.GotoAsync("/admin/items/news/new");
        await Expect(Editor()).ToHaveAttributeAsync("contenteditable", "true");
        await Expect(Editor()).ToHaveAttributeAsync("aria-multiline", "true");
        foreach (var name in new[] { "Bold", "Italic", "Strikethrough", "Inline code", "Heading 2", "Heading 3", "Bulleted list", "Numbered list", "Quote", "Code block", "Link", "Image", "Undo", "Redo" })
        {
            await Expect(ToolbarButton(name), name).ToBeVisibleAsync();
        }

        await Expect(Mode("Rich text")).ToBeCheckedAsync();
        // The toolbar is one Tab stop; arrow keys move between its buttons.
        await ToolbarButton("Bold").FocusAsync();
        await Page.Keyboard.PressAsync("ArrowRight");
        await Expect(ToolbarButton("Italic")).ToBeFocusedAsync();
    }

    [Fact]
    public async Task Formatting_shows_its_pressed_state_and_is_saved_as_Markdown()
    {
        await Page.GotoAsync("/admin/items/news/new");
        await Editor().ClickAsync();
        await Page.Keyboard.TypeAsync("Plain then strong");
        await Page.Keyboard.PressAsync("Shift+Home");
        var bold = ToolbarButton("Bold");
        await Expect(bold).ToHaveAttributeAsync("aria-pressed", "false");
        await bold.ClickAsync();
        await Expect(bold).ToHaveAttributeAsync("aria-pressed", "true");
        Assert.Contains("**Plain then strong**", await Markdown());
    }

    [Fact]
    public async Task Markdown_source_and_rich_text_round_trip()
    {
        await Page.GotoAsync("/admin/items/news/new");
        await Mode("Markdown").ClickAsync();
        await Page.GetByLabel("Content").FillAsync("## Section title\n\n- first\n- second\n\n> quoted");
        await Mode("Rich text").ClickAsync();
        await Expect(Editor().GetByRole(AriaRole.Heading, new() { Level = 2, Name = "Section title" })).ToBeVisibleAsync();
        await Expect(Editor().GetByRole(AriaRole.Listitem)).ToHaveCountAsync(2);
        await Expect(Editor().Locator("blockquote")).ToContainTextAsync("quoted");
    }

    [Fact]
    public async Task Links_must_be_web_email_or_site_addresses()
    {
        await Page.GotoAsync("/admin/items/news/new");
        await Editor().ClickAsync();
        await ToolbarButton("Link").ClickAsync();
        var dialog = Page.GetByRole(AriaRole.Dialog, new() { Name = "Link" });
        await Expect(dialog).ToBeVisibleAsync();
        await dialog.GetByLabel("Link address").FillAsync("javascript:alert(1)");
        await dialog.GetByRole(AriaRole.Button, new() { Name = "Apply link" }).ClickAsync();
        await Expect(dialog.GetByRole(AriaRole.Alert)).ToBeVisibleAsync();
        await dialog.GetByLabel("Link address").FillAsync("https://example.com/guide");
        await dialog.GetByRole(AriaRole.Button, new() { Name = "Apply link" }).ClickAsync();
        await Expect(dialog).ToBeHiddenAsync();
        Assert.Contains("](https://example.com/guide)", await Markdown());
    }

    [Fact]
    public async Task An_image_needs_alt_text_uploads_from_the_editor_and_appears_on_the_published_post()
    {
        var slug = UniqueSlug("picture");
        await Page.GotoAsync("/admin/items/news/new");
        await Page.GetByLabel("Title").FillAsync($"Picture {slug}");
        await Page.GetByLabel("Slug").FillAsync(slug);
        await Editor().ClickAsync();
        await Page.Keyboard.TypeAsync("Before the picture.");
        await ToolbarButton("Image").ClickAsync();
        var dialog = Page.GetByRole(AriaRole.Dialog, new() { Name = "Insert image" });
        await Expect(dialog).ToBeVisibleAsync();
        await dialog.Locator("input[type=\"file\"]").SetInputFilesAsync(Square);
        await dialog.GetByRole(AriaRole.Button, new() { Name = "Insert image" }).ClickAsync();
        await Expect(dialog.GetByRole(AriaRole.Alert), "alt text is required").ToBeVisibleAsync();
        await dialog.GetByLabel("Alt text").FillAsync("A tiny black square");
        await dialog.GetByRole(AriaRole.Button, new() { Name = "Insert image" }).ClickAsync();
        await Expect(dialog).ToBeHiddenAsync();
        await Expect(Editor().GetByRole(AriaRole.Img, new() { Name = "A tiny black square" })).ToBeVisibleAsync();
        Assert.Matches(InsertedImage(), await Markdown());

        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^(create|save)") }).ClickAsync();
        // Wait for the save itself: /admin/news/new would also match a bare id pattern.
        await Expect(Page.GetByRole(AriaRole.Status).Filter(new() { HasTextRegex = Rx("created") })).ToBeVisibleAsync();
        await Expect(Page).ToHaveURLAsync(new Regex($"^{Regex.Escape(Env.BaseUrl)}/admin/items/news/(?!new$)[^/]+$"));
        var post = await BySlug(api, Kind.Article, slug);
        await Action(api, Kind.Article, "publish", post!.Id);
        await Page.GotoAsync($"/news/{slug}"); // /<page>/<item>
        var image = Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Img, new() { Name = "A tiny black square" });
        await Expect(image).ToBeVisibleAsync();
        await Poll.Until(async () => await image.EvaluateAsync<int>("element => element.naturalWidth") > 0, "the image loads");
    }

    [Fact]
    public async Task An_item_image_needs_alt_text_and_shows_in_the_page_list_and_on_the_item_route()
    {
        // A page of its own, so the item is listed whatever else is published.
        var slug = UniqueSlug("cover");
        var host = UniqueSlug("gallery");
        await EnsurePage(api, host, "PUBLISHED", Input(("defaultItemKind", "Photo")));
        await Page.GotoAsync($"/admin/items/{host}/new");
        await Page.GetByLabel("Title").FillAsync($"Cover {slug}");
        await Page.GetByLabel("Slug").FillAsync(slug);
        await Page.GetByLabel("Excerpt").FillAsync("Has a cover image.");
        await Page.GetByRole(AriaRole.Group, new() { Name = "Image" }).Locator("input[type=\"file\"]").SetInputFilesAsync(new FilePayload { Name = "cover.png", MimeType = "image/png", Buffer = Images.Png });
        await Expect(Page.GetByLabel("Image alt text")).ToBeVisibleAsync();
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^(create|save)") }).ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Alert).Filter(new() { HasText = "Please correct" }), "alt text is required").ToBeVisibleAsync();
        await Page.GetByLabel("Image alt text").FillAsync("A tiny cover square");
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^(create|save)") }).ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Status).Filter(new() { HasTextRegex = Rx("created") })).ToBeVisibleAsync();
        var item = await BySlug(api, Kind.Article, slug);
        Assert.Equal("A tiny cover square", item?.ImageAlt);
        await Action(api, Kind.Article, "publish", item!.Id);

        foreach (var path in new[] { $"/pages/{host}", $"/{host}/{slug}" })
        {
            await Page.GotoAsync(path);
            var image = Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Img, new() { Name = "A tiny cover square" }).First;
            await Expect(image, path).ToBeVisibleAsync();
            await Poll.Until(async () => await image.EvaluateAsync<int>("element => element.naturalWidth") > 0, $"{path} image loads");
        }
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Product)]
    public async Task Pages_and_products_are_written_as_rich_text_too_saved_as_Markdown(Kind kind)
    {
        var slug = UniqueSlug($"rich-{kind.ToString().ToLowerInvariant()}");
        await Page.GotoAsync(kind == Kind.Page ? "/admin/pages/new" : "/admin/items/products/new");
        await Expect(Toolbar(), kind.ToString()).ToBeVisibleAsync();
        await Page.GetByLabel("Title").FillAsync($"Rich {slug}");
        await Page.GetByLabel("Slug").FillAsync(slug);
        await Editor().ClickAsync();
        await Toolbar().GetByRole(AriaRole.Button, new() { Name = "Bold" }).ClickAsync();
        await Page.Keyboard.TypeAsync("Strong words");
        await Page.GetByRole(AriaRole.Button, new() { Name = "Create" }).ClickAsync();
        await Expect(Page.GetByRole(AriaRole.Status).Filter(new() { HasTextRegex = Rx("created") })).ToBeVisibleAsync();
        await Poll.Equals(async () => (await BySlug(api, kind, slug))?.Body, "**Strong words**");
    }

    [GeneratedRegex(@"!\[A tiny black square\]\(/media/[a-f0-9]{32}\.png\)")]
    private static partial Regex InsertedImage();
}
