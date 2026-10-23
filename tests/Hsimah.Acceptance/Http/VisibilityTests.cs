using static Hsimah.Acceptance.Lib.Contents;

namespace Hsimah.Acceptance.Http;

// Read and write policies (acceptance 4 and 5): anonymous viewers see published rows only, through every path; only a signed-in
// operator may write.
public sealed class VisibilityData : IAsyncLifetime
{
    public Api Operator { get; private set; } = null!;

    public Api Anonymous { get; private set; } = null!;

    public Dictionary<Kind, (Content Draft, Content Published)> Rows { get; } = [];

    public async ValueTask InitializeAsync()
    {
        Operator = await Api.Operator();
        Anonymous = await Api.Anonymous();
        foreach (var kind in Kinds)
        {
            var draft = await CreateOk(Operator, kind, Input(("title", $"Secret draft {DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}")));
            var published = await CreatePublished(Operator, kind);
            Rows[kind] = (draft, published);
        }
    }

    public async ValueTask DisposeAsync()
    {
        await Operator.DisposeAsync();
        await Anonymous.DisposeAsync();
    }
}

public class VisibilityTests(VisibilityData data) : IClassFixture<VisibilityData>
{
    private Api Operator => data.Operator;

    private Api Anonymous => data.Anonymous;

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Anonymous_collections_and_counts_exclude_drafts(Kind kind)
    {
        var (draft, published) = data.Rows[kind];
        var (nodes, totalCount, bodies) = await Walk(Anonymous, kind);
        var ids = nodes.Select(node => node.Id).ToList();
        Assert.Contains(published.Id, ids);
        Assert.DoesNotContain(draft.Id, ids);
        Assert.True(nodes.All(node => node.Status == "PUBLISHED"));
        Assert.True(totalCount == nodes.Count, "totalCount counts only visible rows");
        foreach (var body in bodies)
        {
            Assert.DoesNotContain(draft.Title, body);
        }
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Anonymous_by_slug_by_id_and_node_lookups_do_not_reveal_drafts(Kind kind)
    {
        var (draft, _) = data.Rows[kind];
        var lookups = new[]
        {
            await BySlugRaw(Anonymous, kind, draft.Slug),
            await ByIdRaw(Anonymous, kind, draft.Id),
            await Anonymous.GraphQL($"query Node($id: ID!) {{ node(id: $id) {{ id ... on {TypeName(kind)} {{ title }} }} }}", new { id = draft.Id }),
        };
        foreach (var result in lookups)
        {
            Assert.DoesNotContain(draft.Title, result.Body);
            Assert.DoesNotContain(draft.Id, result.Data?.ToJsonString() ?? "{}");
        }
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Anonymous_lookups_return_published_rows(Kind kind)
    {
        var (_, published) = data.Rows[kind];
        Assert.Equal(published.Id, (await BySlugRaw(Anonymous, kind, published.Slug)).Data?[$"{Field(kind)}BySlug"]?["id"]?.GetValue<string>());
        Assert.Equal(published.Id, (await ByIdRaw(Anonymous, kind, published.Id)).Data?[Field(kind)]?["id"]?.GetValue<string>());
        var node = await Anonymous.GraphQL($"query Node($id: ID!) {{ node(id: $id) {{ id ... on {TypeName(kind)} {{ title }} }} }}", new { id = published.Id });
        Assert.Equal(published.Id, node.Data?["node"]?["id"]?.GetValue<string>());
        Assert.Equal(published.Title, node.Data?["node"]?["title"]?.GetValue<string>());
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task The_operator_sees_drafts_in_collections(Kind kind)
    {
        var (draft, published) = data.Rows[kind];
        var (nodes, totalCount, _) = await Walk(Operator, kind);
        var ids = nodes.Select(node => node.Id).ToList();
        Assert.Contains(draft.Id, ids);
        Assert.Contains(published.Id, ids);
        Assert.Equal(nodes.Count, totalCount);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Anonymous_visitors_cannot_create_update_publish_unpublish_or_delete(Kind kind)
    {
        var (draft, published) = data.Rows[kind];
        var input = Defaults(kind);
        Api.ExpectRejected(await Create(Anonymous, kind, input), "anonymous create");
        Assert.Null((await BySlugRaw(Operator, kind, (string)input["slug"]!)).Data?[$"{Field(kind)}BySlug"]);

        Api.ExpectRejected(await Update(Anonymous, kind, draft.Id, Input(("title", "Vandalised"))), "anonymous update");
        Api.ExpectRejected(await Action(Anonymous, kind, "publish", draft.Id), "anonymous publish");
        Api.ExpectRejected(await Action(Anonymous, kind, "unpublish", published.Id), "anonymous unpublish");
        Api.ExpectRejected(await Remove(Anonymous, kind, published.Id), "anonymous delete");

        var afterDraft = await ById(Operator, kind, draft.Id);
        Assert.Equal(draft.Title, afterDraft?.Title);
        Assert.Equal("DRAFT", afterDraft?.Status);
        Assert.Equal("PUBLISHED", (await ById(Operator, kind, published.Id))?.Status);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Public_content_never_exposes_account_details(Kind kind)
    {
        var (_, published) = data.Rows[kind];
        var result = await BySlugRaw(Anonymous, kind, published.Slug);
        Assert.DoesNotContain(Env.Username, result.Body);
    }

    [Fact]
    public async Task Ids_of_one_type_never_resolve_as_another_type()
    {
        var item = await CreatePublished(Operator, Kind.Article, Input(("title", $"Cross-type {DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}")));
        var page = await CreatePublished(Operator, Kind.Page, Input(("title", $"Cross-type page {DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}")));
        foreach (var api in new[] { Anonymous, Operator })
        {
            var asPage = await ByIdRaw(api, Kind.Page, item.Id);
            Assert.Null(asPage.Data?["page"]);
            Assert.DoesNotContain(item.Title, asPage.Body);
            var asItem = await ByIdRaw(api, Kind.Article, page.Id);
            Assert.Null(asItem.Data?["pageItem"]);
            Assert.DoesNotContain(page.Title, asItem.Body);
        }

        Api.ExpectRejected(await Update(Operator, Kind.Page, item.Id, Input(("title", "Hijacked"))), "updatePage with a PageItem id");
        Api.ExpectRejected(await Update(Operator, Kind.Article, page.Id, Input(("title", "Hijacked"))), "updatePageItem with a Page id");
        Assert.Equal(item.Title, (await ById(Operator, Kind.Article, item.Id))?.Title);
        Assert.Equal(page.Title, (await ById(Operator, Kind.Page, page.Id))?.Title);
    }

    [Fact]
    public async Task The_operator_profile_is_not_readable_anonymously()
    {
        var viewerId = (await Operator.Viewer())!["id"]!.GetValue<string>();
        var result = await Anonymous.GraphQL("query Profile($id: ID!) { adminUser(id: $id) { id username displayName } }", new { id = viewerId });
        Assert.Null(result.Data?["adminUser"]);
        Assert.DoesNotContain(Env.Username, result.Body);
        Assert.Null(await Anonymous.Viewer());
    }

    [Fact]
    public async Task Visitors_see_an_author_by_display_name_only_on_pages_and_items_alike()
    {
        var item = await CreatePublished(Operator, Kind.Article);
        var page = await CreatePublished(Operator, Kind.Page);
        var itemResult = await Anonymous.GraphQL("query Byline($slug: String!) { pageItemBySlug(slug: $slug) { author { displayName } } }", new { slug = item.Slug });
        Assert.Empty(itemResult.Errors);
        Assert.Equal(Env.DisplayName, itemResult.Data?["pageItemBySlug"]?["author"]?["displayName"]?.GetValue<string>());
        var pageResult = await Anonymous.GraphQL("query Byline($slug: String!) { pageBySlug(slug: $slug) { author { displayName } } }", new { slug = page.Slug });
        Assert.Empty(pageResult.Errors);
        Assert.Equal(Env.DisplayName, pageResult.Data?["pageBySlug"]?["author"]?["displayName"]?.GetValue<string>());
        Assert.DoesNotContain(Env.Username, itemResult.Body + pageResult.Body);
    }
}
