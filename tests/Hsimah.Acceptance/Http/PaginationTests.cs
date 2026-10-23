using static Hsimah.Acceptance.Lib.Contents;

namespace Hsimah.Acceptance.Http;

// Bounded cursor pagination (architecture.md: default 20, maximum 100) and ordering (website.md: items newest published first;
// acceptance 9). V1 accepts short or empty policy-filtered pages, so continuation must still reach every row.
public sealed class PagingData : IAsyncLifetime
{
    public Api Operator { get; private set; } = null!;

    public Api Anonymous { get; private set; } = null!;

    public List<Content> Published { get; } = [];

    public List<Content> Drafts { get; } = [];

    public async ValueTask InitializeAsync()
    {
        Operator = await Api.Operator();
        Anonymous = await Api.Anonymous();
        // 105 published articles with drafts interleaved; publish order is creation order.
        for (var i = 0; i < 105; i++)
        {
            var item = await CreateOk(Operator, Kind.Article, Input(("title", $"Paging {Env.RunId} {i:D3}")));
            Published.Add(await PublishOk(Operator, Kind.Article, item.Id));
            if (i % 5 == 0)
            {
                Drafts.Add(await CreateOk(Operator, Kind.Article, Input(("title", $"Paging draft {Env.RunId} {i}"))));
            }
        }
    }

    public async ValueTask DisposeAsync()
    {
        await Operator.DisposeAsync();
        await Anonymous.DisposeAsync();
    }
}

public class PaginationTests(PagingData data) : IClassFixture<PagingData>
{
    [Fact]
    public async Task A_page_defaults_to_20_rows()
    {
        var page = await PageOf(data.Anonymous, Kind.Article);
        Assert.True(page.Nodes.Count <= 20);
        Assert.True(page.HasNextPage);
        // The newest 20 articles are all published, so this page cannot be short.
        Assert.Equal(20, page.Nodes.Count);
    }

    [Fact]
    public async Task A_page_is_capped_at_100_rows()
    {
        var page = await PageOf(data.Anonymous, Kind.Article, first: 1000);
        Assert.True(page.Nodes.Count <= 100);
        Assert.True(page.HasNextPage);
    }

    [Fact]
    public async Task First_1_returns_one_row_and_a_cursor_to_continue()
    {
        var page = await PageOf(data.Anonymous, Kind.Article, first: 1);
        Assert.Single(page.Nodes);
        Assert.Equal(data.Published[^1].Id, page.Nodes[0].Id);
        Assert.True(page.HasNextPage);
        Assert.False(string.IsNullOrEmpty(page.EndCursor));
    }

    [Fact]
    public async Task Following_cursors_visits_every_published_article_once_newest_first_and_no_drafts()
    {
        foreach (var size in new[] { 7, 20, 100 })
        {
            var (nodes, _, _) = await Walk(data.Anonymous, Kind.Article, size);
            var ids = nodes.Select(node => node.Id).ToList();
            Assert.True(ids.Distinct().Count() == ids.Count, $"no duplicates at page size {size}");
            var published = data.Published.Select(row => row.Id).ToHashSet();
            var ours = ids.Where(published.Contains).ToList();
            Assert.True(ours.SequenceEqual(data.Published.Select(row => row.Id).Reverse()), $"newest first at page size {size}");
            foreach (var draft in data.Drafts)
            {
                Assert.DoesNotContain(draft.Id, ids);
            }
        }
    }

    [Fact]
    public async Task Articles_are_ordered_by_publishedAt_descending_then_id_descending()
    {
        var (nodes, _, _) = await Walk(data.Anonymous, Kind.Article);
        for (var i = 1; i < nodes.Count; i++)
        {
            var previous = DateTimeOffset.Parse(nodes[i - 1].PublishedAt!);
            var current = DateTimeOffset.Parse(nodes[i].PublishedAt!);
            Assert.True(previous >= current, $"{nodes[i - 1].Slug} before {nodes[i].Slug}");
        }
    }

    [Fact]
    public async Task Items_are_read_per_page_products_never_appear_among_articles()
    {
        var product = await CreatePublished(data.Operator, Kind.Product, Input(("title", $"Paging product {Env.RunId}")));
        var (nodes, _, _) = await Walk(data.Anonymous, Kind.Article);
        Assert.DoesNotContain(product.Id, nodes.Select(node => node.Id));
        Assert.True(nodes.All(node => node.PageSlug == "news" && node.ItemKind == "Article"));
        Assert.Contains(product.Id, (await Walk(data.Anonymous, Kind.Product)).Nodes.Select(node => node.Id));
    }

    [Fact]
    public async Task An_unknown_page_lists_no_items()
    {
        var result = await data.Anonymous.GraphQL("{ pageItemsOfPage(where: { page: \"no-such-page\" }, first: 5) { totalCount nodes { id } } }");
        Assert.Empty(result.Errors);
        var list = result.Data!["pageItemsOfPage"]!;
        Assert.Equal(0, list["totalCount"]!.GetValue<int>());
        Assert.Empty(list["nodes"]!.AsArray());
    }

    [Fact]
    public async Task The_operator_pages_through_drafts_too()
    {
        var (nodes, _, _) = await Walk(data.Operator, Kind.Article, 50);
        var ids = nodes.Select(node => node.Id).ToList();
        foreach (var draft in data.Drafts)
        {
            Assert.Contains(draft.Id, ids);
        }
    }
}
