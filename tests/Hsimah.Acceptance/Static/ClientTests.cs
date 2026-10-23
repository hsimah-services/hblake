using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Hsimah.Acceptance.Static;

// Client structure (architecture.md § Frontend, AGENTS.md). The route catalogue groups routes by entity; each entrypoint owns the
// query for its routes, and links are built from the generated URI builders rather than hand-written paths.
public partial class ClientTests
{
    private static readonly HashSet<string> Skip = ["node_modules", "__generated__", "dist"];
    private static readonly string ClientSrc = Path.Combine(Env.RepoRoot, "client/src");

    private static string Relative(string file) => Path.GetRelativePath(Env.RepoRoot, file);

    private static List<string> SourceFiles(string directory)
    {
        var found = new List<string>();
        foreach (var entry in Directory.EnumerateFileSystemEntries(directory))
        {
            var name = Path.GetFileName(entry);
            if (Directory.Exists(entry))
            {
                if (!Skip.Contains(name))
                {
                    found.AddRange(SourceFiles(entry));
                }
            }
            else if (SourceExtension().IsMatch(name) && !name.EndsWith(".d.ts", StringComparison.Ordinal))
            {
                found.Add(entry);
            }
        }

        return found;
    }

    private static List<string> GeneratedArtifacts(string directory)
    {
        var found = new List<string>();
        foreach (var entry in Directory.EnumerateFileSystemEntries(directory))
        {
            if (Directory.Exists(entry))
            {
                if (Path.GetFileName(entry) != "node_modules")
                {
                    found.AddRange(GeneratedArtifacts(entry));
                }
            }
            else if (Path.GetFileName(directory) == "__generated__" && entry.EndsWith(".graphql.ts", StringComparison.Ordinal))
            {
                found.Add(entry);
            }
        }

        return found;
    }

    private static (string File, List<string> EntryPoints) Catalogue()
    {
        var file = Path.Combine(Env.RepoRoot, "client/routes.json");
        var routes = JsonNode.Parse(File.ReadAllText(file))!["routes"]!.AsArray();
        return (file, routes.Select(route => route!["entryPoint"]!.GetValue<string>()).Distinct().ToList());
    }

    [Fact]
    public void Each_entrypoint_preloads_a_query_of_its_own_defined_in_its_own_directory()
    {
        var (file, entryPoints) = Catalogue();
        var owners = new Dictionary<string, string>();
        var problems = new List<string>();
        foreach (var entry in entryPoints)
        {
            var module = Path.GetFullPath(Path.Combine(Path.GetDirectoryName(file)!, entry));
            var fileName = Path.GetFileName(module);
            var name = EntrypointSuffix().Replace(fileName, string.Empty);
            var source = File.ReadAllText(module);
            foreach (Match match in GeneratedImport().Matches(source))
            {
                var specifier = match.Groups[1].Value;
                var operation = match.Groups[2].Value;
                var artifact = Path.GetFullPath(Path.Combine(Path.GetDirectoryName(module)!, specifier));
                if (Path.GetDirectoryName(Path.GetDirectoryName(artifact)) != Path.GetDirectoryName(module))
                {
                    problems.Add($"{Relative(module)} preloads {operation}, which lives outside its directory");
                }

                if (!operation.StartsWith(name, StringComparison.Ordinal))
                {
                    problems.Add($"{Relative(module)} preloads {operation}; its query should be named {name}…Query");
                }

                if (owners.TryGetValue(operation, out var owner) && owner != module)
                {
                    problems.Add($"{Relative(module)} and {Relative(owner)} both preload {operation}");
                }

                owners[operation] = module;
            }
        }

        Assert.Equal(Array.Empty<string>(), problems.ToArray());
    }

    [Fact]
    public void Links_and_redirects_use_the_generated_URI_builders_not_hand_written_route_paths()
    {
        var found = SourceFiles(ClientSrc).SelectMany(file =>
            File.ReadAllText(file).Split('\n').SelectMany((line, index) =>
                RoutePath().Matches(line).Select(match => $"{Relative(file)}:{index + 1} {match.Value}")))
            .ToArray();
        Assert.Equal(Array.Empty<string>(), found);
    }

    [Fact]
    public void Every_Relay_artifact_belongs_to_an_operation_or_fragment_defined_beside_it()
    {
        var sources = new Dictionary<string, string>();
        string DefinedIn(string directory)
        {
            if (!sources.TryGetValue(directory, out var text))
            {
                text = string.Join('\n', Directory.GetFiles(directory).Where(name => SourceExtension().IsMatch(name)).Select(File.ReadAllText));
                sources[directory] = text;
            }

            return text;
        }

        var stale = GeneratedArtifacts(ClientSrc).Where(artifact =>
        {
            var name = Path.GetFileName(artifact)[..^".graphql.ts".Length];
            var owner = Path.GetDirectoryName(Path.GetDirectoryName(artifact))!;
            return !Regex.IsMatch(DefinedIn(owner), $@"\b(query|mutation|subscription|fragment)\s+{Regex.Escape(name)}\b");
        }).Select(Relative).ToArray();
        Assert.Equal(Array.Empty<string>(), stale);
    }

    [Fact]
    public void The_client_contains_no_business_copy_the_owner_has_not_supplied()
    {
        // website.md and AGENTS.md: business name, positioning and claims come from the owner.
        var files = SourceFiles(ClientSrc).Append(Path.Combine(Env.RepoRoot, "client/index.html"));
        var found = files.SelectMany(file =>
            File.ReadAllText(file).Split('\n').SelectMany((line, index) =>
                Regex.IsMatch(line, "consult", RegexOptions.IgnoreCase) ? [$"{Relative(file)}:{index + 1} {line.Trim()[..Math.Min(120, line.Trim().Length)]}"] : Array.Empty<string>()))
            .ToArray();
        Assert.Equal(Array.Empty<string>(), found);
    }

    [GeneratedRegex(@"\.(ts|tsx)$")]
    private static partial Regex SourceExtension();

    [GeneratedRegex(@"\.entrypoint\.tsx?$")]
    private static partial Regex EntrypointSuffix();

    [GeneratedRegex(@"from\s+['""]([^'""]*__generated__/(\w+)\.graphql)['""]")]
    private static partial Regex GeneratedImport();

    [GeneratedRegex(@"(['""`])/(admin|pages|posts|news|products|items)\b[^'""`]*\1?")]
    private static partial Regex RoutePath();
}
