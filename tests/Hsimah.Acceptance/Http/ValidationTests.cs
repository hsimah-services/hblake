using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using static Hsimah.Acceptance.Lib.Contents;

namespace Hsimah.Acceptance.Http;

// Field rules from website.md and Product.md (acceptance 6). Every rejection must also leave storage untouched.
public class ValidationTests : OperatorTest
{
    // Slugs.

    [Fact]
    public async Task A_page_slug_may_not_shadow_a_fixed_route()
    {
        // /<page>/<item> would otherwise collide with /admin, /pages, /auth, /graphql, /media and /assets (tests/README.md, "Reserved slugs").
        foreach (var slug in ReservedSlugs)
        {
            Api.ExpectRejected(await Create(api, Kind.Page, Defaults(Kind.Page, Input(("slug", slug)))), $"page slug {slug}");
            Assert.True(await BySlug(api, Kind.Page, slug) is null, $"no page stored at {slug}");
        }

        var row = await CreateOk(api, Kind.Page);
        foreach (var slug in ReservedSlugs)
        {
            Api.ExpectRejected(await Update(api, Kind.Page, row.Id, Input(("slug", slug))), $"renaming a page to {slug}");
        }

        Assert.Equal(row.Slug, (await ById(api, Kind.Page, row.Id))?.Slug);
    }

    [Fact]
    public async Task A_reserved_word_is_fine_inside_a_longer_slug_and_as_an_item_slug()
    {
        Assert.StartsWith("admin-", (await CreateOk(api, Kind.Page, Input(("slug", $"admin-{UniqueSlug("x")}")))).Slug);
        Assert.StartsWith("media-", (await CreateOk(api, Kind.Article, Input(("slug", $"media-{UniqueSlug("x")}")))).Slug);
    }

    private static string[] Valid() => [$"a{Env.RunId}", $"{Env.RunId}-1-2-3", $"x{Env.RunId}".PadRight(160, 'z')];

    private static string[] Invalid() =>
    [
        "",
        $"Upper-{Env.RunId}",
        $"space {Env.RunId}",
        $"-lead-{Env.RunId}",
        $"trail-{Env.RunId}-",
        $"double--{Env.RunId}",
        $"under_{Env.RunId}",
        $"dot.{Env.RunId}",
        $"slash/{Env.RunId}",
        $"ünï-{Env.RunId}",
        $"y{Env.RunId}".PadRight(161, 'z'),
    ];

    [Fact]
    public async Task Lowercase_ASCII_letters_and_digits_separated_by_single_hyphens_1_to_160_characters_are_accepted()
    {
        foreach (var slug in Valid())
        {
            var row = await CreateOk(api, Kind.Page, Input(("slug", slug)));
            Assert.Equal(slug, row.Slug);
        }
    }

    [Fact]
    public async Task Anything_else_is_rejected_on_create()
    {
        foreach (var slug in Invalid())
        {
            var result = await Create(api, Kind.Page, Defaults(Kind.Page, Input(("slug", slug))));
            Api.ExpectRejected(result, $"slug {JsonSerializer.Serialize(slug)} should be rejected");
            if (slug.Length > 0)
            {
                Assert.True(await BySlug(api, Kind.Page, slug) is null, $"nothing stored for {JsonSerializer.Serialize(slug)}");
            }
        }
    }

    [Fact]
    public async Task Anything_else_is_rejected_on_update()
    {
        var row = await CreateOk(api, Kind.Article);
        foreach (var slug in Invalid())
        {
            Api.ExpectRejected(await Update(api, Kind.Article, row.Id, Input(("slug", slug))), $"slug {JsonSerializer.Serialize(slug)} should be rejected");
        }

        Assert.Equal(row.Slug, (await ById(api, Kind.Article, row.Id))?.Slug);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Slugs_are_unique_within_the_kind(Kind kind)
    {
        var first = await CreateOk(api, kind);
        var duplicate = await Create(api, kind, Defaults(kind, Input(("slug", first.Slug), ("title", "Duplicate"))));
        Api.ExpectRejected(duplicate, "duplicate slug");
        var second = await CreateOk(api, kind);
        Api.ExpectRejected(await Update(api, kind, second.Id, Input(("slug", first.Slug))), "duplicate slug on update");
        Assert.Equal(second.Slug, (await ById(api, kind, second.Id))?.Slug);
    }

    [Fact]
    public async Task A_page_and_an_item_may_share_a_slug_items_of_any_page_may_not()
    {
        var slug = UniqueSlug("shared");
        Assert.Equal(slug, (await CreateOk(api, Kind.Page, Input(("slug", slug)))).Slug);
        Assert.Equal(slug, (await CreateOk(api, Kind.Article, Input(("slug", slug)))).Slug);
        Api.ExpectRejected(await Create(api, Kind.Product, Defaults(Kind.Product, Input(("slug", slug)))), "the slug of an item of another page");
    }

    [Fact]
    public async Task A_slug_may_be_changed_deliberately()
    {
        var row = await CreateOk(api, Kind.Page);
        var slug = UniqueSlug("renamed");
        Assert.Equal(slug, (await UpdateOk(api, Kind.Page, row.Id, Input(("slug", slug)))).Slug);
        Assert.Null(await BySlug(api, Kind.Page, row.Slug));
    }

    // Titles.

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t\n")]
    public async Task Blank_titles_are_rejected(string title)
    {
        var input = Defaults(Kind.Article, Input(("title", title)));
        Api.ExpectRejected(await Create(api, Kind.Article, input));
        Assert.Null(await BySlug(api, Kind.Article, (string)input["slug"]!));
    }

    [Fact]
    public async Task A_title_cannot_be_blanked_on_update()
    {
        var row = await CreateOk(api, Kind.Article);
        Api.ExpectRejected(await Update(api, Kind.Article, row.Id, Input(("title", "  "))));
        Assert.Equal(row.Title, (await ById(api, Kind.Article, row.Id))?.Title);
    }

    [Fact]
    public async Task Titles_are_limited_to_200_characters()
    {
        Assert.Equal(200, (await CreateOk(api, Kind.Page, Input(("title", new string('T', 200))))).Title.Length);
        var input = Defaults(Kind.Page, Input(("title", new string('T', 201))));
        Api.ExpectRejected(await Create(api, Kind.Page, input));
        Assert.Null(await BySlug(api, Kind.Page, (string)input["slug"]!));
    }

    // Excerpts.

    [Fact]
    public async Task Excerpts_are_limited_to_300_characters()
    {
        Assert.Equal(300, (await CreateOk(api, Kind.Article, Input(("excerpt", new string('e', 300))))).Excerpt.Length);
        var input = Defaults(Kind.Article, Input(("excerpt", new string('e', 301))));
        Api.ExpectRejected(await Create(api, Kind.Article, input));
        Assert.Null(await BySlug(api, Kind.Article, (string)input["slug"]!));
    }

    // Bodies.

    [Fact]
    public async Task Requests_over_1_MiB_are_refused_and_nothing_is_stored()
    {
        var input = Defaults(Kind.Article, Input(("content", new string('x', 1024 * 1024 + 1))));
        var result = await Create(api, Kind.Article, input);
        Api.ExpectRejected(result, "a body over 1 MiB");
        Assert.Null(await BySlug(api, Kind.Article, (string)input["slug"]!));
    }

    [Fact]
    public async Task A_large_body_under_the_limit_is_accepted()
    {
        var content = $"# Large\n\n{string.Concat(Enumerable.Repeat("Lorem ipsum dolor sit amet. ", 18_000))}";
        Assert.True(content.Length < 600_000);
        Assert.Equal(content, (await CreateOk(api, Kind.Article, Input(("content", content)))).Body);
    }

    // Item enquiry URLs (shown for Products).

    [Fact]
    public async Task HTTPS_and_valid_mailto_URLs_are_accepted()
    {
        foreach (var enquiryUrl in new[] { "https://example.com/contact", "https://example.com/a?b=c#d", "mailto:hello@example.com" })
        {
            Assert.Equal(enquiryUrl, (await CreateOk(api, Kind.Product, Input(("enquiryUrl", enquiryUrl)))).EnquiryUrl);
        }
    }

    [Fact]
    public async Task Every_other_URL_is_rejected()
    {
        string[] rejected =
        [
            "http://example.com",
            "javascript:alert(1)",
            "JAVASCRIPT:alert(1)",
            "data:text/html,<script>alert(1)</script>",
            "ftp://example.com",
            "https://",
            "mailto:",
            "mailto:not-an-address",
            "example.com",
            "not a url",
            $"https://example.com/{new string('a', 2048)}",
        ];
        foreach (var enquiryUrl in rejected)
        {
            var input = Defaults(Kind.Product, Input(("enquiryUrl", enquiryUrl)));
            Api.ExpectRejected(await Create(api, Kind.Product, input), $"enquiryUrl {enquiryUrl[..Math.Min(60, enquiryUrl.Length)]}");
            Assert.Null(await BySlug(api, Kind.Product, (string)input["slug"]!));
        }
    }

    [Fact]
    public async Task EnquiryUrl_is_optional_and_can_be_cleared()
    {
        var without = await CreateOk(api, Kind.Product);
        Assert.Null(without.EnquiryUrl);
        var withUrl = await CreateOk(api, Kind.Product, Input(("enquiryUrl", "https://example.com/x")));
        Assert.Null((await UpdateOk(api, Kind.Product, withUrl.Id, Input(("enquiryUrl", null)))).EnquiryUrl);
    }

    // Item image.

    private async Task<string> Stored()
    {
        var response = await Images.Upload(api, "a.png", "image/png", Images.Png);
        return (await response.JsonAsync())!.Value.GetProperty("url").GetString()!;
    }

    [Fact]
    public async Task An_uploaded_image_with_alt_text_is_accepted_and_can_be_cleared()
    {
        var imageUrl = await Stored();
        var row = await CreateOk(api, Kind.Product, Input(("imageUrl", imageUrl), ("imageAlt", "A black square")));
        Assert.Equal(imageUrl, row.ImageUrl);
        Assert.Equal("A black square", row.ImageAlt);
        var cleared = await UpdateOk(api, Kind.Product, row.Id, Input(("imageUrl", null), ("imageAlt", null)));
        Assert.Null(cleared.ImageUrl);
        Assert.Null(cleared.ImageAlt);
        var plain = await CreateOk(api, Kind.Product);
        Assert.Null(plain.ImageUrl);
        Assert.Null(plain.ImageAlt);
    }

    [Fact]
    public async Task Alt_text_is_required_and_only_stored_uploads_are_accepted()
    {
        var imageUrl = await Stored();
        Dictionary<string, object?>[] cases =
        [
            Input(("imageUrl", imageUrl)),
            Input(("imageUrl", imageUrl), ("imageAlt", "   ")),
            Input(("imageUrl", "https://example.com/a.png"), ("imageAlt", "x")),
            Input(("imageUrl", "/media/../etc/passwd"), ("imageAlt", "x")),
            Input(("imageUrl", "javascript:alert(1)"), ("imageAlt", "x")),
            Input(("imageUrl", $"/media/{new string('a', 32)}.svg"), ("imageAlt", "x")),
        ];
        foreach (var overrides in cases)
        {
            var input = Defaults(Kind.Product, overrides);
            Api.ExpectRejected(await Create(api, Kind.Product, input), $"image {Api.Trim(JsonSerializer.Serialize(overrides), 80)}");
            Assert.Null(await BySlug(api, Kind.Product, (string)input["slug"]!));
        }
    }

    [Fact]
    public async Task Omitting_a_field_on_update_leaves_it_unchanged()
    {
        foreach (var kind in Kinds)
        {
            var row = await CreateOk(api, kind, kind == Kind.Product ? Input(("enquiryUrl", "https://example.com/keep")) : null);
            var updated = await UpdateOk(api, kind, row.Id, Input(("title", $"{row.Title} renamed")));
            Assert.Equal(row.Slug, updated.Slug);
            Assert.Equal(row.Body, updated.Body);
            Assert.Equal(row.Excerpt, updated.Excerpt);
            if (kind == Kind.Product)
            {
                Assert.Equal("https://example.com/keep", updated.EnquiryUrl);
            }
        }
    }

    // Error messages are safe. Acceptance 6: rejections produce safe errors. Messages may explain the rule that was broken; they
    // must not echo storage, SQL, PHP or stack details.
    private static readonly Regex Internal = new(
        @"SQLSTATE|constraint failed|integrity constraint|PDO|sqlite|hsimah_\w+|\.php\b|stack trace|#\d+ /|timezone could not be found|failed to parse time string|at position \d+|Cosmos|Microsoft\.|System\.|\.cs\b| at Hsimah",
        RegexOptions.IgnoreCase);

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Nulls_for_required_fields_and_malformed_times_are_refused_without_internals(Kind kind)
    {
        var row = await CreateOk(api, kind);
        var attempts = new (string Label, Dictionary<string, object?> Input)[]
        {
            ("title: null", Input(("title", null))),
            ("slug: null", Input(("slug", null))),
            ("content: null", Input(("content", null))),
            ("publishedAt: malformed", Input(("publishedAt", "not a date"))),
        };
        foreach (var (label, input) in attempts)
        {
            var result = await Update(api, kind, row.Id, input);
            Api.ExpectRejected(result, label);
            Assert.DoesNotMatch(Internal, result.Body);
        }

        var after = await ById(api, kind, row.Id);
        Assert.True(JsonNode.DeepEquals(row.Raw, after!.Raw), "the row is unchanged");
    }
}
