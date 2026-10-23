using System.Globalization;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Hsimah.Acceptance.Lib;

// GraphQL names follow from the spec and the GraphQL builder: the `graphql.singular`/`plural` integration settings give
// `page`/`pages` and `pageItem`/`pageItems`, mutations are `create{Type}`, `update{Type}`, `{action}{Type}` and `delete{Type}`
// taking `input: {Name}Input!`, and their payload carries the row under the lcfirst type name.
//
// Articles and Products are not types of their own: both are PageItems (spec/entities/PageItem.md) attached to a Page that holds
// items (News and Products) and labelled by their `kind`. `Kind` names what a test is about; `TypeName` is the GraphQL type.
public enum Kind
{
    Page,
    Article,
    Product,
}

public sealed record Host(string Slug, string Title, string DefaultItemKind);

/// <summary>A Page or PageItem as the tests select it.</summary>
public sealed class Content(JsonNode raw)
{
    public JsonNode Raw { get; } = raw;

    public string Id => Text("id")!;

    public string Title => Text("title")!;

    public string Slug => Text("slug")!;

    public string Body => Text("content")!;

    public string Excerpt => Text("excerpt")!;

    public string Status => Text("status")!;

    public string? PublishedAt => Text("publishedAt");

    public string CreatedAt => Text("createdAt")!;

    public string UpdatedAt => Text("updatedAt")!;

    public string? AuthorName => Raw["author"]?["displayName"]?.GetValue<string>();

    public string? ItemKind => Text("kind");

    public string? EnquiryUrl => Text("enquiryUrl");

    public string? ImageUrl => Text("imageUrl");

    public string? ImageAlt => Text("imageAlt");

    public string? PageId => Raw["page"]?["id"]?.GetValue<string>();

    public string? PageSlug => Raw["page"]?["slug"]?.GetValue<string>();

    public string? Text(string key) => Raw[key] is JsonValue value && value.TryGetValue<string>(out var text) ? text : null;
}

public sealed record ConnectionPage(long TotalCount, bool HasNextPage, string? EndCursor, List<Content> Nodes);

public static partial class Contents
{
    public static readonly Kind[] Kinds = [Kind.Page, Kind.Article, Kind.Product];

    /// <summary>The seeded page each item kind lives on, and the label its items are given.</summary>
    public static readonly Dictionary<Kind, Host> Hosts = new()
    {
        [Kind.Article] = new Host("news", "News", "Article"),
        [Kind.Product] = new Host("products", "Products", "Product"),
    };

    /// <summary>Page slugs that would shadow a fixed route (tests/README.md, "Reserved slugs").</summary>
    public static readonly string[] ReservedSlugs = ["admin", "assets", "auth", "graphql", "media", "pages"];

    public static bool IsItem(Kind kind) => kind != Kind.Page;

    public static string TypeName(Kind kind) => IsItem(kind) ? "PageItem" : "Page";

    public static string Field(Kind kind) => IsItem(kind) ? "pageItem" : "page";

    public static string Collection(Kind kind) => Field(kind) + "s";

    /// <summary>Pages live at /pages/&lt;slug&gt;; an item lives at /&lt;its page's slug&gt;/&lt;its slug&gt;.</summary>
    public static string PublicPath(Kind kind, string slug) => IsItem(kind) ? $"/{Hosts[kind].Slug}/{slug}" : $"/pages/{slug}";

    /// <summary>A page that holds items is listed at its own page address, /pages/&lt;slug&gt;.</summary>
    public static string ListPath(Kind kind) => $"/pages/{Hosts[kind].Slug}";

    /// <summary>Admin sections: /admin/pages, and /admin/items/&lt;page slug&gt; for the items of a page.</summary>
    public static string AdminPath(Kind kind) => IsItem(kind) ? $"/admin/items/{Hosts[kind].Slug}" : "/admin/pages";

    /// <summary>The lowercase label used in "New article" and "No products".</summary>
    public static string Noun(Kind kind) => kind.ToString().ToLowerInvariant();

    public static string Selection(Kind kind)
    {
        const string common = "id title slug content excerpt status publishedAt createdAt updatedAt author { displayName }";
        return IsItem(kind) ? $"{common} kind enquiryUrl imageUrl imageAlt page {{ id slug }}" : common;
    }

    // The operator session that finds or creates the pages items attach to.
    private static readonly SemaphoreSlim HostGate = new(1, 1);
    private static readonly Dictionary<Kind, Content> HostPages = [];
    private static Api? hostSession;

    /// <summary>The published page whose items carry this kind: seeded, else created on demand.</summary>
    public static async Task<Content> HostPage(Kind kind)
    {
        await HostGate.WaitAsync();
        try
        {
            if (!HostPages.TryGetValue(kind, out var host))
            {
                hostSession ??= await Api.Operator();
                var info = Hosts[kind];
                host = await EnsurePage(hostSession, info.Slug, "PUBLISHED", new() { ["title"] = info.Title, ["defaultItemKind"] = info.DefaultItemKind });
                HostPages[kind] = host;
            }

            return host;
        }
        finally
        {
            HostGate.Release();
        }
    }

    private static int counter;

    /// <summary>A slug valid under website.md's rule and unique to this run.</summary>
    public static string UniqueSlug(string label = "t") => $"{label}-{Env.RunId}-{Interlocked.Increment(ref counter)}".ToLowerInvariant();

    public static Dictionary<string, object?> Defaults(Kind kind, Dictionary<string, object?>? overrides = null)
    {
        overrides ??= [];
        var slug = overrides.TryGetValue("slug", out var given) && given is string text ? text : UniqueSlug(Noun(kind));
        var input = new Dictionary<string, object?>
        {
            ["title"] = $"{kind} {slug}",
            ["slug"] = slug,
            ["content"] = $"Body of {slug}.\n\n## Section\n\nSome **bold** text.",
            ["excerpt"] = $"Excerpt of {slug}.",
        };
        foreach (var (key, value) in overrides)
        {
            input[key] = value;
        }

        return input;
    }

    /// <summary>Shorthand for building input maps.</summary>
    public static Dictionary<string, object?> Input(params (string Key, object? Value)[] pairs) => pairs.ToDictionary(pair => pair.Key, pair => pair.Value);

    /// <summary>An item's input: attached to the kind's page and labelled with the kind, unless given.</summary>
    private static async Task<Dictionary<string, object?>> WithHost(Kind kind, Dictionary<string, object?> input)
    {
        if (!IsItem(kind))
        {
            return input;
        }

        var merged = new Dictionary<string, object?> { ["page"] = (await HostPage(kind)).Id, ["kind"] = kind.ToString() };
        foreach (var (key, value) in input)
        {
            merged[key] = value;
        }

        return merged;
    }

    public static async Task<GraphQLResult> Create(Api api, Kind kind, Dictionary<string, object?> input)
    {
        var type = TypeName(kind);
        return await api.GraphQL(
            $"mutation Create($input: Create{type}Input!) {{ create{type}(input: $input) {{ {Field(kind)} {{ {Selection(kind)} }} }} }}",
            new { input = await WithHost(kind, input) });
    }

    public static async Task<Content> CreateOk(Api api, Kind kind, Dictionary<string, object?>? overrides = null)
    {
        var input = Defaults(kind, overrides);
        var result = await Create(api, kind, input);
        Assert.True(result.Errors.Count == 0, $"create{TypeName(kind)} errors: {Api.Trim(result.Body, 500)}");
        var row = result.Data?[$"create{TypeName(kind)}"]?[Field(kind)];
        Assert.True(row is not null, $"create{TypeName(kind)} returns the created {kind}");
        return new Content(row!);
    }

    public static Task<GraphQLResult> Update(Api api, Kind kind, string id, Dictionary<string, object?> input)
    {
        var merged = new Dictionary<string, object?> { ["id"] = id };
        foreach (var (key, value) in input)
        {
            merged[key] = value;
        }

        return api.GraphQL(
            $"mutation Update($input: Update{TypeName(kind)}Input!) {{ update{TypeName(kind)}(input: $input) {{ {Field(kind)} {{ {Selection(kind)} }} }} }}",
            new { input = merged });
    }

    public static async Task<Content> UpdateOk(Api api, Kind kind, string id, Dictionary<string, object?> input)
    {
        var result = await Update(api, kind, id, input);
        Assert.True(result.Errors.Count == 0, $"update{TypeName(kind)} errors: {Api.Trim(result.Body, 500)}");
        return new Content(result.Data![$"update{TypeName(kind)}"]![Field(kind)]!);
    }

    public static Task<GraphQLResult> Action(Api api, Kind kind, string name, string id)
    {
        var mutation = $"{name}{TypeName(kind)}";
        var inputType = $"{char.ToUpperInvariant(name[0])}{name[1..]}{TypeName(kind)}Input";
        return api.GraphQL(
            $"mutation Action($input: {inputType}!) {{ {mutation}(input: $input) {{ {Field(kind)} {{ {Selection(kind)} }} }} }}",
            new { input = new { id } });
    }

    public static async Task<Content> PublishOk(Api api, Kind kind, string id)
    {
        var result = await Action(api, kind, "publish", id);
        Assert.True(result.Errors.Count == 0, $"publish{TypeName(kind)} errors: {Api.Trim(result.Body, 500)}");
        return new Content(result.Data![$"publish{TypeName(kind)}"]![Field(kind)]!);
    }

    public static async Task<Content> UnpublishOk(Api api, Kind kind, string id)
    {
        var result = await Action(api, kind, "unpublish", id);
        Assert.True(result.Errors.Count == 0, $"unpublish{TypeName(kind)} errors: {Api.Trim(result.Body, 500)}");
        return new Content(result.Data![$"unpublish{TypeName(kind)}"]![Field(kind)]!);
    }

    public static Task<GraphQLResult> Remove(Api api, Kind kind, string id) =>
        api.GraphQL($"mutation Delete($input: Delete{TypeName(kind)}Input!) {{ delete{TypeName(kind)}(input: $input) {{ deletedId }} }}", new { input = new { id } });

    public static async Task<Content> CreatePublished(Api api, Kind kind, Dictionary<string, object?>? overrides = null)
    {
        var row = await CreateOk(api, kind, overrides);
        return await PublishOk(api, kind, row.Id);
    }

    /// <summary>Result of <c>{kind}BySlug</c>; data may be null when the viewer cannot see the row.</summary>
    public static Task<GraphQLResult> BySlugRaw(Api api, Kind kind, string slug) =>
        api.GraphQL($"query BySlug($slug: String!) {{ {Field(kind)}BySlug(slug: $slug) {{ {Selection(kind)} }} }}", new { slug });

    public static async Task<Content?> BySlug(Api api, Kind kind, string slug)
    {
        var result = await BySlugRaw(api, kind, slug);
        return result.Data?[$"{Field(kind)}BySlug"] is { } row ? new Content(row) : null;
    }

    public static Task<GraphQLResult> ByIdRaw(Api api, Kind kind, string id) =>
        api.GraphQL($"query ById($id: ID!) {{ {Field(kind)}(id: $id) {{ {Selection(kind)} }} }}", new { id });

    public static async Task<Content?> ById(Api api, Kind kind, string id)
    {
        var result = await ByIdRaw(api, kind, id);
        return result.Data?[Field(kind)] is { } row ? new Content(row) : null;
    }

    private static string ConnectionName(Kind kind) => IsItem(kind) ? "pageItemsOfPage" : Collection(kind);

    public static Task<GraphQLResult> PageOfRaw(Api api, Kind kind, int? first = null, string? after = null)
    {
        var parameters = new List<string>();
        var variables = new Dictionary<string, object?>();
        if (IsItem(kind))
        {
            parameters.Add($"where: {{ page: {System.Text.Json.JsonSerializer.Serialize(Hosts[kind].Slug)} }}");
        }

        if (first is not null)
        {
            parameters.Add("first: $first");
            variables["first"] = first;
        }

        if (after is not null)
        {
            parameters.Add("after: $after");
            variables["after"] = after;
        }

        var declared = string.Join(", ", new[] { first is not null ? "$first: Int" : "", after is not null ? "$after: String" : "" }.Where(part => part.Length > 0));
        // Items are read through the connection of their page: pageItemsOfPage(where: { page }).
        var name = ConnectionName(kind);
        var arguments = parameters.Count > 0 ? $"({string.Join(", ", parameters)})" : string.Empty;
        return api.GraphQL(
            $"query Page{(declared.Length > 0 ? $"({declared})" : "")} {{ {name}{arguments} {{ totalCount pageInfo {{ hasNextPage endCursor }} nodes {{ {Selection(kind)} }} }} }}",
            variables);
    }

    public static ConnectionPage ParsePage(JsonNode connection) => new(
        connection["totalCount"]!.GetValue<long>(),
        connection["pageInfo"]!["hasNextPage"]!.GetValue<bool>(),
        connection["pageInfo"]!["endCursor"]?.GetValue<string>(),
        connection["nodes"]!.AsArray().Select(node => new Content(node!)).ToList());

    public static async Task<ConnectionPage> PageOf(Api api, Kind kind, int? first = null, string? after = null)
    {
        var result = await PageOfRaw(api, kind, first, after);
        Assert.True(result.Errors.Count == 0, $"{Collection(kind)} errors: {Api.Trim(result.Body, 500)}");
        return ParsePage(result.Data![ConnectionName(kind)]!);
    }

    /// <summary>
    /// Every row the viewer can see, following endCursor while hasNextPage, including through short or empty pages, which v1
    /// accepts for policy-filtered lists.
    /// </summary>
    public static async Task<(List<Content> Nodes, long TotalCount, List<string> Bodies)> Walk(Api api, Kind kind, int first = 100)
    {
        var nodes = new List<Content>();
        var bodies = new List<string>();
        string? after = null;
        long totalCount = 0;
        for (var i = 0; i < 1000; i++)
        {
            var result = await PageOfRaw(api, kind, first, after);
            Assert.True(result.Errors.Count == 0, $"{Collection(kind)} errors: {Api.Trim(result.Body, 500)}");
            bodies.Add(result.Body);
            var page = ParsePage(result.Data![ConnectionName(kind)]!);
            totalCount = page.TotalCount;
            nodes.AddRange(page.Nodes);
            if (!page.HasNextPage)
            {
                return (nodes, totalCount, bodies);
            }

            Assert.True(!string.IsNullOrEmpty(page.EndCursor), "hasNextPage implies an endCursor");
            after = page.EndCursor;
        }

        throw new InvalidOperationException($"{Collection(kind)} pagination did not terminate");
    }

    /// <summary>Find or create the Page with this slug in the requested state; returns it.</summary>
    public static async Task<Content> EnsurePage(Api api, string slug, string state, Dictionary<string, object?>? overrides = null)
    {
        var page = await BySlug(api, Kind.Page, slug);
        if (page is null)
        {
            var merged = new Dictionary<string, object?> { ["slug"] = slug };
            foreach (var (key, value) in overrides ?? [])
            {
                merged[key] = value;
            }

            page = await CreateOk(api, Kind.Page, Defaults(Kind.Page, merged));
        }

        if (state == "PUBLISHED" && page.Status != "PUBLISHED")
        {
            page = await PublishOk(api, Kind.Page, page.Id);
        }

        if (state == "DRAFT" && page.Status != "DRAFT")
        {
            page = await UnpublishOk(api, Kind.Page, page.Id);
        }

        return page;
    }

    public static readonly Regex UtcTimestamp = new(@"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|\+00:00)$");

    public static void ExpectRecent(string? timestamp, string label, double toleranceMs = 120_000)
    {
        Assert.True(timestamp is not null, $"{label} is set");
        Assert.True(UtcTimestamp.IsMatch(timestamp!), $"{label} is an ISO 8601 UTC timestamp: {timestamp}");
        var skew = Math.Abs((DateTimeOffset.Parse(timestamp!, CultureInfo.InvariantCulture) - DateTimeOffset.UtcNow).TotalMilliseconds);
        Assert.True(skew < toleranceMs, $"{label} ({timestamp}) is within {toleranceMs / 1000}s of now");
    }
}
