using System.Text.Json.Nodes;
using Elephentity.Runtime.Gateway;
using Elephentity.Runtime.Storage;
using GraphQL.Transport;
using Hsimah.Domain;
using Microsoft.Extensions.DependencyInjection;

[assembly: System.Runtime.Versioning.UnsupportedOSPlatform("windows")]

namespace Hsimah.Tests;

/// <summary>The application over the in-memory driver: the real policies, verifiers, queries and GraphQL schema, with no Cosmos.</summary>
public sealed class Stack : IDisposable
{
    private readonly ServiceProvider services;

    public Stack(HsimahOptions? options = null)
    {
        var collection = new ServiceCollection().AddLogging();
        collection.AddSingleton(options ?? new HsimahOptions { ContentFile = Path.Combine(RepoRoot(), "content", "pages.json") });
        collection.AddSingleton<IStorageAdaptor>(new Elephentity.Runtime.Memory.MemoryAdaptor());
        collection.AddHsimahDomain();
        services = collection.BuildServiceProvider();
        Runtime = services.GetRequiredService<Elephentity.Runtime.Gateway.Runtime>();
    }

    public IServiceProvider Services => services;

    public Elephentity.Runtime.Gateway.Runtime Runtime { get; }

    /// <summary>Runs a GraphQL operation as <paramref name="actor" /> (a visitor when none is given).</summary>
    public async Task<JsonNode> Execute(string query, object? variables = null, Actor? actor = null)
    {
        var executor = services.GetRequiredService<HsimahExecutor>();
        using var scope = RequestViewerProvider.Use(actor ?? Actor.Visitor);
        var request = new GraphQLRequest { Query = query, Variables = variables is null ? null : executor.Serializer.Deserialize<global::GraphQL.Inputs>(System.Text.Json.JsonSerializer.Serialize(variables)) };
        var result = await executor.ExecuteAsync(request, services);
        return JsonNode.Parse(executor.Serializer.Serialize(result))!;
    }

    public async Task<MutationOutcome> Create(string entity, Dictionary<string, object?> input)
    {
        using var scope = RequestViewerProvider.Use(Actor.Operator);
        var created = await Runtime.CreateAsync(entity, input);
        return new MutationOutcome(created.Id, created.Entity);
    }

    public sealed record MutationOutcome(Elephentity.Runtime.Identity.EntityId Id, object? Entity);

    public void Dispose() => services.Dispose();

    public static string RepoRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, "eleph.json")))
            {
                return directory.FullName;
            }
        }

        throw new InvalidOperationException("Could not find the repository root.");
    }
}
