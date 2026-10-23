using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Hsimah.Acceptance.Static;

// Repository-level checks that need no running server. The build gates themselves (eleph fmt/validate/generate --check/check,
// the C# build, the unit tests, tsquid routes:check, lint, typecheck, build) run through scripts/acceptance/gates; see
// tests/README.md.
public partial class RepositoryTests
{
    private static readonly HashSet<string> Skip = ["node_modules", ".git", ".cache", ".var", "bin", "obj", "test-results", "dist", "spec", "tests", "tools", ".pnpm-store"];

    private static string Path_(params string[] parts) => Path.Combine([Env.RepoRoot, .. parts]);

    private static List<string> FindFiles(string directory, string name)
    {
        var found = new List<string>();
        foreach (var entry in Directory.EnumerateFileSystemEntries(directory))
        {
            var entryName = Path.GetFileName(entry);
            if (Directory.Exists(entry))
            {
                if (!Skip.Contains(entryName))
                {
                    found.AddRange(FindFiles(entry, name));
                }
            }
            else if (entryName == name)
            {
                found.Add(entry);
            }
        }

        return found;
    }

    private static JsonNode ReadJson(string file) => JsonNode.Parse(File.ReadAllText(file))!;

    private static List<string> AppRouteCatalogues() =>
        FindFiles(Env.RepoRoot, "routes.json").Where(file => ReadJson(file)["runtime"]?.GetValue<string>() == "@tsquid/routes").ToList();

    [Fact]
    public void The_client_routes_json_is_the_specified_route_catalogue()
    {
        var catalogues = AppRouteCatalogues();
        Assert.True(catalogues.Count == 1, $"exactly one tsquid routes.json outside spec/, found: {string.Join(", ", catalogues)}");
        Assert.True(JsonNode.DeepEquals(ReadJson(catalogues[0]), ReadJson(Path_("spec/ui/routes.json"))));
    }

    [Fact]
    public void Every_route_entrypoint_exists_beside_the_client_routes_json()
    {
        var catalogue = AppRouteCatalogues().FirstOrDefault();
        Assert.True(catalogue is not null, "a tsquid routes.json exists");
        var missing = ReadJson(catalogue!)["routes"]!.AsArray()
            .Select(route => route!["entryPoint"]!.GetValue<string>())
            .Distinct()
            .Where(entry => !File.Exists(Path.Combine(Path.GetDirectoryName(catalogue)!, entry)))
            .ToArray();
        Assert.Equal(Array.Empty<string>(), missing);
    }

    [Fact]
    public void Eleph_json_declares_the_C_Sharp_Cosmos_and_GraphQL_targets_over_spec()
    {
        var file = Path_("eleph.json");
        Assert.True(File.Exists(file), "eleph.json at the repository root");
        var config = ReadJson(file);
        Assert.Equal("spec", config["spec"]!.GetValue<string>());
        foreach (var target in new[] { "csharp", "cosmos", "graphql" })
        {
            Assert.False(string.IsNullOrEmpty(config["targets"]?[target]?["builder"]?.GetValue<string>()), $"targets.{target}.builder");
            Assert.False(string.IsNullOrEmpty(config["targets"]?[target]?["output"]?.GetValue<string>()), $"targets.{target}.output");
        }
    }

    [Fact]
    public void The_generated_tree_is_committed_for_every_entity_and_target()
    {
        var config = ReadJson(Path_("eleph.json"));
        var csharp = Path_(config["targets"]!["csharp"]!["output"]!.GetValue<string>());
        var expected = new List<string>
        {
            Path.Combine(csharp, "Catalogue.cs"),
            Path.Combine(csharp, "Wiring.cs"),
            Path_(config["targets"]!["cosmos"]!["output"]!.GetValue<string>(), "CosmosStorageManifest.cs"),
            Path_(config["targets"]!["graphql"]!["output"]!.GetValue<string>(), "GraphQLManifest.cs"),
        };
        expected.AddRange(new[] { "Page", "PageItem", "User" }.Select(entity => Path.Combine(csharp, entity, $"{entity}.cs")));
        Assert.Equal(Array.Empty<string>(), expected.Where(file => !File.Exists(file)).Select(file => Path.GetRelativePath(Env.RepoRoot, file)).ToArray());
    }

    [Fact]
    public void Post_and_Product_are_gone_from_the_model()
    {
        var config = ReadJson(Path_("eleph.json"));
        var csharp = config["targets"]!["csharp"]!["output"]!.GetValue<string>();
        foreach (var name in new[] { "Post", "Product" })
        {
            Assert.False(File.Exists(Path_("spec/entities", $"{name}.yml")), $"spec/entities/{name}.yml");
            Assert.False(Directory.Exists(Path_(csharp, name)), $"{csharp}/{name}");
        }
    }

    [Fact]
    public void User_is_not_exposed_through_the_generated_GraphQL_manifest()
    {
        var user = File.ReadAllText(Path_("spec/entities/User.yml"));
        Assert.False(Regex.IsMatch(user, @"^integrations:", RegexOptions.Multiline), "spec/entities/User.yml declares no integrations");

        var config = ReadJson(Path_("eleph.json"));
        var manifest = File.ReadAllText(Path_(config["targets"]!["graphql"]!["output"]!.GetValue<string>(), "GraphQLManifest.cs"));
        Assert.DoesNotMatch(@"new\([^)]*""User""\s*,\s*""Users?""", manifest);
        Assert.DoesNotMatch(@"RootFieldEntry\(""User""", manifest);
        Assert.DoesNotMatch(@"""(create|update|delete)User""", manifest);
    }

    [Fact]
    public void The_temporary_provides_snapshot_is_removed_once_real_builders_exist()
    {
        foreach (var file in new[] { "spec/provides.json", "spec/provides.md" })
        {
            Assert.False(File.Exists(Path_(file)), $"{file} removed (AGENTS.md)");
        }
    }

    [Fact]
    public void README_documents_how_to_build_run_and_test_the_site()
    {
        var readme = File.ReadAllText(Path_("README.md"));
        Assert.True(readme.Trim().Length > 200, "README.md has build/run instructions");
        Assert.Contains("tests/run.sh", readme);
    }

    [Fact]
    public void The_acceptance_harness_scripts_exist_and_are_executable()
    {
        var missing = new[] { "gates", "up", "down", "bootstrap", "install", "backup", "restore", "expire-sessions", "set-active" }.Where(name =>
        {
            var file = Path_("scripts/acceptance", name);
            return !File.Exists(file) || (File.GetUnixFileMode(file) & UnixFileMode.UserExecute) == 0;
        }).ToArray();
        Assert.Equal(Array.Empty<string>(), missing);
    }

    [Fact]
    public void Elephentity_dependencies_are_released_versions_not_local_paths_forks_or_extra_sources()
    {
        // spec/upstream.md: temporary pins are removed once compatible tagged fixes land. Packages come from nuget.org at an exact
        // version, builders are pinned name@version releases, and nothing points at a source checkout.
        var packages = Regex.Matches(File.ReadAllText(Path_("src/Hsimah.Server/Hsimah.Server.csproj")), @"<PackageReference Include=""(Elephentity\.[\w.]+)"" Version=""([^""]+)""");
        Assert.NotEmpty(packages);
        var unpinned = packages.Where(match => !ExactVersion().IsMatch(match.Groups[2].Value)).Select(match => $"{match.Groups[1].Value}: {match.Groups[2].Value}").ToArray();
        Assert.Equal(Array.Empty<string>(), unpinned);

        var projects = new[] { "src", "tests" }.SelectMany(root => Directory.GetFiles(Path_(root), "*.csproj", SearchOption.AllDirectories));
        foreach (var project in projects)
        {
            Assert.DoesNotMatch(@"ProjectReference[^>]*[Ee]lephentity", File.ReadAllText(project));
        }

        Assert.False(File.Exists(Path_("nuget.config")) && Regex.IsMatch(File.ReadAllText(Path_("nuget.config")), @"<add key=""[^""]+"" value=""(?!https://api\.nuget\.org)"), "extra NuGet sources");

        var config = ReadJson(Path_("eleph.json"));
        var builders = config["targets"]!.AsObject().Select(target => target.Value!["builder"]!.GetValue<string>()).Append(config["codegen"]!.GetValue<string>());
        var unversioned = builders.Where(builder => !Regex.IsMatch(builder, @"@\d+\.\d+\.\d+(-[\w.]+)?$")).ToArray();
        Assert.Equal(Array.Empty<string>(), unversioned);
    }

    [Fact]
    public void The_specification_describes_the_implementation_as_it_is()
    {
        var docs = new[] { "spec/README.md", "spec/acceptance.md", "spec/architecture.md", "spec/upstream.md", "README.md" };
        var problems = docs.SelectMany(doc =>
        {
            var text = File.ReadAllText(Path_(doc));
            var found = new List<string>();
            // spec/upstream.md keeps the historical validation command; other docs describe the present.
            if (doc != "spec/upstream.md" && Regex.IsMatch(text, @"provides\.(json|md)\b"))
            {
                found.Add($"{doc} still refers to the removed provides snapshot");
            }

            // Test counts go stale with the next test; "tests/run.sh passes" is the claim.
            foreach (Match match in Regex.Matches(text, @"\b\d+\s+(Playwright|operator[- ]procedure|application unit|PHP unit|unit)\s+(tests|checks)\b", RegexOptions.IgnoreCase))
            {
                found.Add($"{doc} hardcodes a test count: \"{match.Value}\"");
            }

            return found;
        }).ToArray();
        Assert.Equal(Array.Empty<string>(), problems);
    }

    [GeneratedRegex(@"^\d+\.\d+\.\d+(-[\w.]+)?$")]
    private static partial Regex ExactVersion();
}
