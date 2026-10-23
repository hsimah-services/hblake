using static Hsimah.Acceptance.Lib.Contents;

namespace Hsimah.Acceptance.Http;

// Page placement (issue #13, Page.md): pages choose whether they show in the navigation and on the home page, in what order and in
// which colour.
public class PlacementTests : OperatorTest
{
    private const string Placement = "showInNavigation navigationOrder featureOnHome homeOrder accent";

    private async Task<System.Text.Json.Nodes.JsonNode> ReadPlacement(string id) =>
        (await api.Ok($"query($id: ID!) {{ page(id: $id) {{ {Placement} }} }}", new { id }))["page"]!;

    [Fact]
    public async Task A_new_page_shows_in_the_navigation_after_the_launch_pages_and_is_not_a_home_tile()
    {
        var created = await Create(api, Kind.Page, Defaults(Kind.Page));
        Assert.Empty(created.Errors);
        var placement = await ReadPlacement(created.Data!["createPage"]!["page"]!["id"]!.GetValue<string>());
        Assert.True(placement["showInNavigation"]!.GetValue<bool>());
        Assert.Equal(100, placement["navigationOrder"]!.GetValue<int>());
        Assert.False(placement["featureOnHome"]!.GetValue<bool>());
        Assert.Equal(100, placement["homeOrder"]!.GetValue<int>());
        Assert.Equal("INK", placement["accent"]!.GetValue<string>());
    }

    [Fact]
    public async Task A_page_featured_on_the_home_page_needs_a_colour()
    {
        Api.ExpectRejected(await Create(api, Kind.Page, Defaults(Kind.Page, Input(("featureOnHome", true)))), "featured with no colour");
        var created = await Create(api, Kind.Page, Defaults(Kind.Page, Input(("featureOnHome", true), ("accent", "BLUE"))));
        Assert.Empty(created.Errors);
        var id = created.Data!["createPage"]!["page"]!["id"]!.GetValue<string>();
        Api.ExpectRejected(await Update(api, Kind.Page, id, Input(("accent", "INK"))), "removing the colour of a featured page");
        Assert.Equal("BLUE", (await ReadPlacement(id))["accent"]!.GetValue<string>());
    }

    [Fact]
    public async Task Orders_are_whole_numbers_from_0_to_999()
    {
        foreach (var order in new[] { -1, 1000 })
        {
            Api.ExpectRejected(await Create(api, Kind.Page, Defaults(Kind.Page, Input(("navigationOrder", order)))), $"navigation order {order}");
            Api.ExpectRejected(await Create(api, Kind.Page, Defaults(Kind.Page, Input(("homeOrder", order)))), $"home order {order}");
        }
    }

    [Fact]
    public async Task PlacedPages_lists_published_pages_for_the_home_page_or_the_navigation_in_order()
    {
        await using var anonymous = await Api.Anonymous();
        var later = await CreatePublished(api, Kind.Page, Input(("featureOnHome", true), ("homeOrder", 2), ("accent", "GREEN"), ("showInNavigation", false)));
        var first = await CreatePublished(api, Kind.Page, Input(("featureOnHome", true), ("homeOrder", 1), ("accent", "BLUE"), ("showInNavigation", false)));
        var draft = await CreateOk(api, Kind.Page, Input(("featureOnHome", true), ("homeOrder", 0), ("accent", "BLUE")));

        async Task<List<string>> Slugs(bool home)
        {
            var data = await anonymous.Ok("query($home: Boolean!) { placedPages(where: { home: $home }, first: 100) { nodes { slug } } }", new { home });
            return data["placedPages"]!["nodes"]!.AsArray().Select(node => node!["slug"]!.GetValue<string>()).ToList();
        }

        var homeSlugs = await Slugs(true);
        Assert.True(homeSlugs.IndexOf(first.Slug) >= 0);
        Assert.True(homeSlugs.IndexOf(first.Slug) < homeSlugs.IndexOf(later.Slug), "by home order");
        Assert.DoesNotContain(draft.Slug, homeSlugs);
        Assert.DoesNotContain(first.Slug, await Slugs(false));
    }
}
