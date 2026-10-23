using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Hsimah.Acceptance.Http;

// The GraphQL surface: generated content operations, the application-owned viewer and operator profile, and nothing that exposes
// User or credentials (architecture.md, User.md, acceptance 5).
public sealed class SchemaData : IAsyncLifetime
{
    private const string TypeRef = "kind name ofType { kind name ofType { kind name ofType { kind name } } }";

    private static readonly string Introspection = $$"""
        query Schema {
          __schema {
            queryType { name }
            mutationType { name }
            types {
              kind name
              fields(includeDeprecated: true) { name type { {{TypeRef}} } args { name type { {{TypeRef}} } } }
              inputFields { name type { {{TypeRef}} } }
              enumValues(includeDeprecated: true) { name }
            }
          }
        }
        """;

    public Dictionary<string, JsonNode> Types { get; } = [];

    public JsonNode QueryType { get; private set; } = null!;

    public JsonNode MutationType { get; private set; } = null!;

    public async ValueTask InitializeAsync()
    {
        await using var api = await Api.Anonymous();
        var data = await api.Ok(Introspection);
        foreach (var type in data["__schema"]!["types"]!.AsArray())
        {
            Types[type!["name"]!.GetValue<string>()] = type;
        }

        QueryType = Types[data["__schema"]!["queryType"]!["name"]!.GetValue<string>()];
        Assert.True(data["__schema"]!["mutationType"] is not null, "schema has a mutation root");
        MutationType = Types[data["__schema"]!["mutationType"]!["name"]!.GetValue<string>()];
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

public partial class SchemaTests(SchemaData schema) : IClassFixture<SchemaData>
{
    // Articles and Products are PageItems, so the schema has two content types.
    private static readonly (string Type, string Field)[] Content = [("Page", "page"), ("PageItem", "pageItem")];

    private Dictionary<string, JsonNode> Types => schema.Types;

    private static string Named(JsonNode reference) => reference["name"] is JsonValue name ? name.GetValue<string>() : Named(reference["ofType"]!);

    private static List<string> FieldNames(JsonNode? type)
    {
        if (type is null)
        {
            return [];
        }

        var fields = type["fields"] as JsonArray ?? type["inputFields"] as JsonArray ?? [];
        return fields.Select(field => field!["name"]!.GetValue<string>()).ToList();
    }

    private JsonNode? TypeOf(JsonNode owner, string name)
    {
        var field = (owner["fields"] as JsonArray ?? []).FirstOrDefault(candidate => candidate!["name"]!.GetValue<string>() == name);
        return field is null ? null : Types.GetValueOrDefault(Named(field["type"]!));
    }

    private JsonNode? ArgInput(string name)
    {
        var mutation = (schema.MutationType["fields"] as JsonArray ?? []).FirstOrDefault(field => field!["name"]!.GetValue<string>() == name);
        var input = (mutation?["args"] as JsonArray)?.FirstOrDefault(arg => arg!["name"]!.GetValue<string>() == "input");
        return input is null ? null : Types.GetValueOrDefault(Named(input["type"]!));
    }

    private static void ExpectSame(IEnumerable<string> expected, IEnumerable<string> actual) =>
        Assert.Equal(expected.OrderBy(x => x, StringComparer.Ordinal), actual.OrderBy(x => x, StringComparer.Ordinal));

    [Fact]
    public void Content_root_fields_exist_for_every_content_type()
    {
        var roots = FieldNames(schema.QueryType);
        foreach (var (_, field) in Content)
        {
            Assert.Contains(field, roots);
            Assert.Contains($"{field}s", roots);
            Assert.Contains($"{field}BySlug", roots);
        }

        Assert.Contains("pageItemsOfPage", roots);
        foreach (var name in new[] { "node", "viewer", "adminUser" })
        {
            Assert.Contains(name, roots);
        }
    }

    [Fact]
    public void There_are_no_Post_or_Product_types_fields_or_operations()
    {
        foreach (var name in new[] { "Post", "Product" })
        {
            Assert.False(Types.ContainsKey(name), $"GraphQL type {name}");
        }

        var everything = FieldNames(schema.QueryType).Concat(FieldNames(schema.MutationType));
        Assert.Equal(Array.Empty<string>(), everything.Where(name => Regex.IsMatch(name, "post|product", RegexOptions.IgnoreCase)).ToArray());
    }

    [Fact]
    public void Items_are_listed_by_page_newest_published_first_with_a_page_filter()
    {
        var ofPage = (schema.QueryType["fields"] as JsonArray)!.First(field => field!["name"]!.GetValue<string>() == "pageItemsOfPage")!;
        var args = ofPage["args"]!.AsArray().Select(arg => arg!["name"]!.GetValue<string>()).ToList();
        foreach (var name in new[] { "after", "first", "where" })
        {
            Assert.Contains(name, args);
        }

        var where = Types[Named(ofPage["args"]!.AsArray().First(arg => arg!["name"]!.GetValue<string>() == "where")!["type"]!)];
        Assert.Equal(["page"], FieldNames(where));
    }

    [Fact]
    public void Content_mutations_exist_for_every_content_type()
    {
        var mutations = FieldNames(schema.MutationType);
        foreach (var (type, _) in Content)
        {
            foreach (var name in new[] { $"create{type}", $"update{type}", $"publish{type}", $"unpublish{type}", $"delete{type}" })
            {
                Assert.Contains(name, mutations);
            }
        }

        Assert.Contains("updateAdminUser", mutations);
    }

    [Fact]
    public void No_generic_User_type_or_account_lifecycle_operations_are_exposed()
    {
        Assert.False(Types.ContainsKey("User"), "no GraphQL type named User");
        var accountFields = FieldNames(schema.QueryType).Concat(FieldNames(schema.MutationType))
            .Where(name => Regex.IsMatch(name, "user", RegexOptions.IgnoreCase)).OrderBy(name => name, StringComparer.Ordinal);
        Assert.Equal(["adminUser", "updateAdminUser"], accountFields);
    }

    [Fact]
    public void No_type_exposes_credentials_or_session_secrets()
    {
        var offending = new List<string>();
        foreach (var (name, type) in Types)
        {
            if (name.StartsWith("__", StringComparison.Ordinal))
            {
                continue;
            }

            foreach (var field in FieldNames(type))
            {
                if (Regex.IsMatch(field, "password|passwordhash|credential|secret|session|resettoken|apitoken", RegexOptions.IgnoreCase))
                {
                    offending.Add($"{name}.{field}");
                }
            }
        }

        Assert.Equal(Array.Empty<string>(), offending.ToArray());
    }

    [Fact]
    public void Content_types_expose_the_specified_fields_everything_links_only_an_author_display_name()
    {
        string[] common = ["id", "title", "slug", "content", "excerpt", "status", "publishedAt", "createdAt", "updatedAt", "author"];
        var extra = new Dictionary<string, string[]>
        {
            ["Page"] = ["showInNavigation", "navigationOrder", "featureOnHome", "homeOrder", "accent", "defaultItemKind", "items", "itemCount", "publishedItemCount"],
            ["PageItem"] = ["kind", "enquiryUrl", "imageUrl", "imageAlt", "page"],
        };
        foreach (var (type, _) in Content)
        {
            Assert.True(Types.TryGetValue(type, out var content), $"GraphQL type {type}");
            ExpectSame(common.Concat(extra[type]), FieldNames(content));
            var author = TypeOf(content!, "author");
            Assert.True(author?["kind"]?.GetValue<string>() == "OBJECT", $"{type}.author");
            Assert.Equal(["displayName"], FieldNames(author));
        }

        ExpectSame(FieldNames(Types["Page"]), FieldNames(TypeOf(Types["PageItem"], "page")));
    }

    [Fact]
    public void Create_and_update_inputs_never_accept_ids_authors_or_managed_timestamps()
    {
        foreach (var (type, _) in Content)
        {
            var create = FieldNames(ArgInput($"create{type}"));
            var update = FieldNames(ArgInput($"update{type}"));
            foreach (var name in new[] { "title", "slug", "content", "excerpt" })
            {
                Assert.Contains(name, create);
            }

            Assert.Contains("id", update);
            foreach (var managed in new[] { "createdAt", "updatedAt", "author" })
            {
                Assert.DoesNotContain(managed, create);
                Assert.DoesNotContain(managed, update);
            }

            Assert.DoesNotContain("id", create);
        }

        var item = FieldNames(ArgInput("createPageItem"));
        foreach (var name in new[] { "page", "kind", "enquiryUrl", "imageUrl", "imageAlt" })
        {
            Assert.Contains(name, item);
        }

        Assert.Contains("enquiryUrl", FieldNames(ArgInput("updatePageItem")));
        Assert.Contains("defaultItemKind", FieldNames(ArgInput("createPage")));
    }

    [Fact]
    public void Publication_status_is_the_DRAFT_PUBLISHED_enum()
    {
        var status = TypeOf(Types["Page"], "status")!;
        Assert.Equal("ENUM", status["kind"]!.GetValue<string>());
        ExpectSame(["DRAFT", "PUBLISHED"], status["enumValues"]!.AsArray().Select(value => value!["name"]!.GetValue<string>()));
    }

    [Fact]
    public void Viewer_exposes_only_id_displayName_and_role()
    {
        var viewer = TypeOf(schema.QueryType, "viewer");
        Assert.NotNull(viewer);
        ExpectSame(["displayName", "id", "role"], FieldNames(viewer));
    }

    [Fact]
    public void The_operator_profile_DTO_and_its_input_are_allowlisted()
    {
        var profile = TypeOf(schema.QueryType, "adminUser");
        Assert.NotNull(profile);
        ExpectSame(["displayName", "id", "username"], FieldNames(profile));
        ExpectSame(["displayName", "id"], FieldNames(ArgInput("updateAdminUser")).Where(name => name != "clientMutationId"));
    }

    [Fact]
    public void Content_types_are_Relay_nodes()
    {
        Assert.Equal("INTERFACE", Types["Node"]["kind"]!.GetValue<string>());
        var node = (schema.QueryType["fields"] as JsonArray)!.First(field => field!["name"]!.GetValue<string>() == "node")!;
        Assert.Equal(["id"], node["args"]!.AsArray().Select(arg => arg!["name"]!.GetValue<string>()));
    }

    [Fact]
    public void The_client_schema_snapshot_matches_the_running_server()
    {
        // relay-compiler validates operations against client/schema.graphql only, so a server change that is not re-exported would
        // otherwise pass every gate.
        var sdl = File.ReadAllText(Path.Combine(Env.RepoRoot, "client/schema.graphql"));
        var client = SdlSignatures(sdl);
        var server = ServerSignatures();
        Assert.Equal(Array.Empty<string>(), server.Except(client).OrderBy(x => x, StringComparer.Ordinal).Select(x => "onlyOnServer: " + x).ToArray());
        Assert.Equal(Array.Empty<string>(), client.Except(server).OrderBy(x => x, StringComparer.Ordinal).Select(x => "onlyInClient: " + x).ToArray());
    }

    private static readonly HashSet<string> BuiltInScalars = ["String", "Int", "Float", "Boolean", "ID"];

    private static string Render(JsonNode reference) => reference["kind"]!.GetValue<string>() switch
    {
        "NON_NULL" => $"{Render(reference["ofType"]!)}!",
        "LIST" => $"[{Render(reference["ofType"]!)}]",
        _ => reference["name"]!.GetValue<string>(),
    };

    private HashSet<string> ServerSignatures()
    {
        var output = new HashSet<string>();
        foreach (var (name, type) in Types)
        {
            if (name.StartsWith("__", StringComparison.Ordinal) || BuiltInScalars.Contains(name))
            {
                continue;
            }

            if (type["kind"]!.GetValue<string>() == "SCALAR")
            {
                output.Add($"scalar {name}");
            }

            foreach (var value in type["enumValues"] as JsonArray ?? [])
            {
                output.Add($"{name}.{value!["name"]!.GetValue<string>()}");
            }

            foreach (var field in type["inputFields"] as JsonArray ?? [])
            {
                output.Add($"{name}.{field!["name"]!.GetValue<string>()}: {Render(field["type"]!)}");
            }

            foreach (var field in type["fields"] as JsonArray ?? [])
            {
                var args = string.Join(", ", (field!["args"] as JsonArray ?? []).Select(arg => $"{arg!["name"]!.GetValue<string>()}: {Render(arg["type"]!)}"));
                output.Add($"{name}.{field["name"]!.GetValue<string>()}{(args.Length > 0 ? $"({args})" : "")}: {Render(field["type"]!)}");
            }
        }

        return output;
    }

    private static HashSet<string> SdlSignatures(string sdl)
    {
        var output = new HashSet<string>();
        var text = DocString().Replace(sdl, string.Empty);
        text = QuotedString().Replace(text, string.Empty);
        text = Comment().Replace(text, string.Empty);
        foreach (Match match in Scalar().Matches(text))
        {
            output.Add($"scalar {match.Groups[1].Value}");
        }

        foreach (Match match in Definition().Matches(text))
        {
            var keyword = match.Groups[1].Value;
            var name = match.Groups[2].Value;
            var body = match.Groups[3].Value;
            if (keyword == "enum")
            {
                foreach (Match value in Word().Matches(body))
                {
                    output.Add($"{name}.{value.Value}");
                }

                continue;
            }

            foreach (Match field in FieldPattern().Matches(body))
            {
                var args = string.Join(", ", field.Groups[2].Value.Split([',', '\n'])
                    .Select(arg => Default().Replace(arg.Trim(), string.Empty))
                    .Where(arg => arg.Length > 0)
                    .Select(arg => Colon().Replace(arg, ": ", 1)));
                output.Add($"{name}.{field.Groups[1].Value}{(args.Length > 0 ? $"({args})" : "")}: {field.Groups[3].Value}");
            }
        }

        return output;
    }

    [GeneratedRegex(@"""""""[\s\S]*?""""""")]
    private static partial Regex DocString();

    [GeneratedRegex(@"""(?:[^""\\\n]|\\.)*""")]
    private static partial Regex QuotedString();

    [GeneratedRegex(@"#[^\n]*")]
    private static partial Regex Comment();

    [GeneratedRegex(@"^scalar\s+(\w+)", RegexOptions.Multiline)]
    private static partial Regex Scalar();

    [GeneratedRegex(@"^(type|interface|input|enum)\s+(\w+)[^{]*\{([^}]*)\}", RegexOptions.Multiline)]
    private static partial Regex Definition();

    [GeneratedRegex(@"\w+")]
    private static partial Regex Word();

    [GeneratedRegex(@"(\w+)\s*(?:\(([^)]*)\))?\s*:\s*([\w!\[\]]+)")]
    private static partial Regex FieldPattern();

    [GeneratedRegex(@"\s*=.*$")]
    private static partial Regex Default();

    [GeneratedRegex(@"\s*:\s*")]
    private static partial Regex Colon();
}
