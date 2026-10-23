using static Hsimah.Acceptance.Lib.Contents;

namespace Hsimah.Acceptance.Http;

// Shared Content and Timestamps behaviour for Page and for PageItem (as Article and Product) (acceptance 2).
public class ContentLifecycleTests : OperatorTest
{
    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Create_stores_the_shared_fields_and_starts_as_an_unpublished_draft(Kind kind)
    {
        var input = Defaults(kind, kind == Kind.Product ? Input(("enquiryUrl", "https://example.com/enquire")) : null);
        var row = await CreateOk(api, kind, input);
        Assert.Equal((string)input["title"]!, row.Title);
        Assert.Equal((string)input["slug"]!, row.Slug);
        Assert.Equal((string)input["content"]!, row.Body);
        Assert.Equal((string)input["excerpt"]!, row.Excerpt);
        Assert.Equal("DRAFT", row.Status);
        Assert.Null(row.PublishedAt);
        if (kind == Kind.Product)
        {
            Assert.Equal("https://example.com/enquire", row.EnquiryUrl);
        }

        Assert.False(string.IsNullOrEmpty(row.Id));
        ExpectRecent(row.CreatedAt, "createdAt");
        ExpectRecent(row.UpdatedAt, "updatedAt");
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Content_and_excerpt_default_to_empty_strings_on_create(Kind kind)
    {
        var slug = UniqueSlug(Field(kind));
        var result = await Create(api, kind, Input(("title", $"Minimal {slug}"), ("slug", slug)));
        Assert.Empty(result.Errors);
        var row = result.Data![$"create{TypeName(kind)}"]![Field(kind)]!;
        Assert.Equal("", row["content"]!.GetValue<string>());
        Assert.Equal("", row["excerpt"]!.GetValue<string>());
        Assert.Equal("DRAFT", row["status"]!.GetValue<string>());
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Update_changes_fields_advances_updatedAt_and_keeps_createdAt(Kind kind)
    {
        var row = await CreateOk(api, kind);
        await Task.Delay(1_100);
        var updated = await UpdateOk(api, kind, row.Id, Input(("title", $"{row.Title} (edited)"), ("excerpt", "Edited excerpt.")));
        Assert.Equal($"{row.Title} (edited)", updated.Title);
        Assert.Equal("Edited excerpt.", updated.Excerpt);
        Assert.Equal(row.Slug, updated.Slug);
        Assert.Equal(row.CreatedAt, updated.CreatedAt);
        Assert.Matches(UtcTimestamp, updated.UpdatedAt);
        Assert.True(DateTimeOffset.Parse(updated.UpdatedAt) > DateTimeOffset.Parse(row.UpdatedAt));
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Changing_the_title_never_changes_the_slug(Kind kind)
    {
        var row = await CreateOk(api, kind);
        var updated = await UpdateOk(api, kind, row.Id, Input(("title", "A completely different title")));
        Assert.Equal(row.Slug, updated.Slug);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Clients_cannot_supply_managed_timestamps_on_create(Kind kind)
    {
        var input = Defaults(kind, Input(("createdAt", "2000-01-01T00:00:00+00:00"), ("updatedAt", "2000-01-01T00:00:00+00:00")));
        Api.ExpectRejected(await Create(api, kind, input), "createdAt/updatedAt are not create inputs");
        Assert.Null(await BySlug(api, kind, (string)input["slug"]!));
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Clients_cannot_supply_managed_timestamps_on_update(Kind kind)
    {
        var row = await CreateOk(api, kind);
        Api.ExpectRejected(await Update(api, kind, row.Id, Input(("updatedAt", "2000-01-01T00:00:00+00:00"))));
        Api.ExpectRejected(await Update(api, kind, row.Id, Input(("createdAt", "2000-01-01T00:00:00+00:00"))));
        var after = await ById(api, kind, row.Id);
        Assert.Equal(row.CreatedAt, after?.CreatedAt);
        Assert.Equal(row.UpdatedAt, after?.UpdatedAt);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Delete_removes_the_record_and_reports_its_id(Kind kind)
    {
        var row = await CreateOk(api, kind);
        var result = await Remove(api, kind, row.Id);
        Assert.Empty(result.Errors);
        Assert.Equal(row.Id, result.Data![$"delete{TypeName(kind)}"]!["deletedId"]!.GetValue<string>());
        Assert.Null(await ById(api, kind, row.Id));
        Assert.Null(await BySlug(api, kind, row.Slug));
    }

    // Authorship.

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task The_signed_in_author_is_recorded_by_the_server(Kind kind)
    {
        var row = await CreateOk(api, kind);
        Assert.Equal(Env.DisplayName, row.AuthorName);
        var updated = await UpdateOk(api, kind, row.Id, Input(("title", $"{row.Title} again")));
        Assert.Equal(Env.DisplayName, updated.AuthorName);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Clients_cannot_choose_the_author(Kind kind)
    {
        var viewer = (await api.Viewer())!;
        foreach (object author in new object[] { viewer["id"]!.GetValue<string>(), "someone-else", new { displayName = "Somebody" } })
        {
            var input = Defaults(kind, Input(("author", author)));
            Api.ExpectRejected(await Create(api, kind, input), $"author {System.Text.Json.JsonSerializer.Serialize(author)} is not an input");
            Assert.Null(await BySlug(api, kind, (string)input["slug"]!));
        }
    }

    // Items belong to a page.

    [Fact]
    public async Task An_item_is_attached_to_its_page_and_labelled_with_a_kind()
    {
        var host = await HostPage(Kind.Article);
        var row = await CreateOk(api, Kind.Article);
        Assert.Equal(host.Id, row.PageId);
        Assert.Equal(Hosts[Kind.Article].Slug, row.PageSlug);
        Assert.Equal("Article", row.ItemKind);
        var product = await CreateOk(api, Kind.Product);
        Assert.Equal(Hosts[Kind.Product].Slug, product.PageSlug);
        Assert.Equal("Product", product.ItemKind);
    }

    [Fact]
    public async Task A_page_chooses_the_kind_of_item_it_holds_and_new_items_default_to_it()
    {
        var host = await HostPage(Kind.Article);
        var data = await api.Ok("query($id: ID!) { page(id: $id) { defaultItemKind } }", new { id = host.Id });
        Assert.Equal("Article", data["page"]!["defaultItemKind"]!.GetValue<string>());
        var slug = UniqueSlug("default-kind");
        var result = await api.GraphQL(
            "mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { kind } } }",
            new { input = new { page = host.Id, title = $"Default kind {slug}", slug } });
        Assert.Empty(result.Errors);
        Assert.Equal("Article", result.Data!["createPageItem"]!["pageItem"]!["kind"]!.GetValue<string>());
    }

    [Fact]
    public async Task One_page_can_hold_items_of_several_kinds()
    {
        var host = await HostPage(Kind.Article);
        var row = await CreateOk(api, Kind.Article, Input(("kind", "Framework")));
        Assert.Equal("Framework", row.ItemKind);
        Assert.Equal(host.Id, row.PageId);
    }

    [Fact]
    public async Task An_item_needs_an_existing_page_that_holds_items()
    {
        var plain = await CreateOk(api, Kind.Page);
        var product = await CreateOk(api, Kind.Product);
        var attempts = new (string Label, Dictionary<string, object?> Extra)[]
        {
            ("a page that holds no items", Input(("page", plain.Id))),
            ("a missing page id", Input(("page", "no-such-page"))),
            ("an item id as the page", Input(("page", product.Id))),
            ("a blank kind", Input(("kind", "  "))),
            ("a kind over 80 characters", Input(("kind", new string('k', 81)))),
        };
        foreach (var (label, extra) in attempts)
        {
            var input = Defaults(Kind.Article, extra);
            Api.ExpectRejected(await Create(api, Kind.Article, input), label);
            Assert.True(await BySlug(api, Kind.Article, (string)input["slug"]!) is null, $"{label}: nothing stored");
        }

        var result = await api.GraphQL(
            "mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id } } }",
            new { input = new { title = "No page", slug = UniqueSlug("no-page") } });
        Api.ExpectRejected(result, "an item without a page");
    }

    [Fact]
    public async Task Item_slugs_are_unique_across_every_item_whatever_its_page()
    {
        var article = await CreateOk(api, Kind.Article);
        Api.ExpectRejected(await Create(api, Kind.Product, Defaults(Kind.Product, Input(("slug", article.Slug)))), "same slug on another page");
    }

    [Fact]
    public async Task Deleting_a_page_deletes_its_items()
    {
        var slug = UniqueSlug("doomed");
        var page = await CreateOk(api, Kind.Page, Input(("slug", slug), ("defaultItemKind", "Note")));
        var result = await api.GraphQL(
            "mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id } } }",
            new { input = new { page = page.Id, title = "Goes with its page", slug = UniqueSlug("goes") } });
        Assert.Empty(result.Errors);
        var itemId = result.Data!["createPageItem"]!["pageItem"]!["id"]!.GetValue<string>();
        Assert.Empty((await Remove(api, Kind.Page, page.Id)).Errors);
        Assert.True(await ById(api, Kind.Article, itemId) is null, "the item went with its page");
    }

    [Fact]
    public async Task A_published_item_is_visible_only_while_its_page_is_published()
    {
        var slug = UniqueSlug("draft-host");
        var page = await CreateOk(api, Kind.Page, Input(("slug", slug), ("defaultItemKind", "Note")));
        var created = await api.GraphQL(
            "mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id slug } } }",
            new { input = new { page = page.Id, title = "On a draft page", slug = UniqueSlug("on-draft"), content = "Body." } });
        var item = created.Data!["createPageItem"]!["pageItem"]!;
        await using var anonymous = await Api.Anonymous();
        await PublishOk(api, Kind.Article, item["id"]!.GetValue<string>());
        Assert.True(await BySlug(anonymous, Kind.Article, item["slug"]!.GetValue<string>()) is null, "invisible while its page is a draft");
        await PublishOk(api, Kind.Page, page.Id);
        Assert.Equal(item["id"]!.GetValue<string>(), (await BySlug(anonymous, Kind.Article, item["slug"]!.GetValue<string>()))?.Id);
    }

    [Fact]
    public async Task A_page_counts_its_items_all_of_them_for_staff_only_published_ones_for_visitors()
    {
        var page = await CreateOk(api, Kind.Page, Input(("slug", UniqueSlug("counted")), ("defaultItemKind", "Note")));
        await PublishOk(api, Kind.Page, page.Id);
        var ids = new List<string>();
        foreach (var label in new[] { "one", "two" })
        {
            var created = await api.GraphQL(
                "mutation($input: CreatePageItemInput!) { createPageItem(input: $input) { pageItem { id } } }",
                new { input = new { page = page.Id, title = $"Counted {label}", slug = UniqueSlug(label), content = "Body." } });
            ids.Add(created.Data!["createPageItem"]!["pageItem"]!["id"]!.GetValue<string>());
        }

        await PublishOk(api, Kind.Article, ids[0]);
        const string counts = "query($id: ID!) { page(id: $id) { itemCount publishedItemCount } }";
        var staff = (await api.Ok(counts, new { id = page.Id }))["page"]!;
        Assert.Equal(2, staff["itemCount"]!.GetValue<int>());
        Assert.Equal(1, staff["publishedItemCount"]!.GetValue<int>());
        await using var anonymous = await Api.Anonymous();
        var visitor = (await anonymous.Ok(counts, new { id = page.Id }))["page"]!;
        Assert.Equal(1, visitor["itemCount"]!.GetValue<int>());
        Assert.Equal(1, visitor["publishedItemCount"]!.GetValue<int>());
    }
}
