using Elephentity.GraphQL;
using Elephentity.GraphQL.Manifest;
using Elephentity.GraphQL.Relay;
using Elephentity.GraphQL.Schema;
using Elephentity.Runtime.Gateway;
using Elephentity.Runtime.Identity;
using Elephentity.Runtime.Storage;
using Hsimah.Domain;
using Hsimah.Entity;
using Hsimah.Entity.Enums;
using Hsimah.GraphQL;
using GraphQL;
using GraphQL.Resolvers;
using GraphQL.Types;
using Microsoft.Extensions.DependencyInjection;

namespace Hsimah;

/// <summary>
/// The generated GraphQL schema plus what the application owns: the viewer, the operator profile, the public author name and the
/// item counts of a page. Names are fixed by the acceptance tests (tests/README.md).
/// </summary>
public static class HsimahSchema
{
    public sealed record Author(string DisplayName);

    public sealed record ViewerDto(string Id, string DisplayName, string Role);

    public static ISchema Build(IServiceProvider services, ElephentityGraphQLOptions options)
    {
        var schema = (Schema)ElephentitySchema.Build(Manifest(services), options);
        var query = schema.Query;
        var gateway = () => services.GetRequiredService<Elephentity.Runtime.Gateway.Runtime>();

        var author = new ObjectGraphType { Name = "Author" };
        author.AddField(new FieldType
        {
            Name = "displayName",
            ResolvedType = new NonNullGraphType(new GraphQLTypeReference("String")),
            Resolver = new FuncFieldResolver<string>(context => ((Author)context.Source!).DisplayName),
        });
        schema.RegisterType(author);

        var viewer = new ObjectGraphType { Name = "Viewer" };
        viewer.AddField(Field("id", new GraphQLTypeReference("ID"), context => Viewer(context)?.Id));
        viewer.AddField(Field("displayName", new GraphQLTypeReference("String"), context => Viewer(context)?.DisplayName));
        viewer.AddField(Field("role", new GraphQLTypeReference("UserRole"), context => Viewer(context)?.Role));
        schema.RegisterType(viewer);
        query.AddField(Field("viewer", new GraphQLTypeReference("Viewer"), _ => ViewerOf(RequestViewerProvider.Actor)));

        var admin = new ObjectGraphType { Name = "AdminUser" };
        admin.AddField(Field("id", new NonNullGraphType(new GraphQLTypeReference("ID")), context => ((Profile)context.Source!).Id));
        admin.AddField(Field("username", new GraphQLTypeReference("String"), context => ((Profile)context.Source!).Username));
        admin.AddField(Field("displayName", new GraphQLTypeReference("String"), context => ((Profile)context.Source!).DisplayName));
        schema.RegisterType(admin);
        var adminUser = new FieldType
        {
            Name = "adminUser",
            ResolvedType = new GraphQLTypeReference("AdminUser"),
            Arguments = new QueryArguments(new QueryArgument(new NonNullGraphType(new GraphQLTypeReference("ID"))) { Name = "id" }),
            Resolver = new FuncFieldResolver<object>(async context =>
            {
                RequireAdmin();
                var id = GlobalId.EntityIdOf(context.GetArgument<string>("id"), "User");
                var user = id is null ? null : await gateway().FindAsync("User", id, context.CancellationToken).ConfigureAwait(false);
                return user is User found ? ProfileOf(found) : null;
            }),
        };
        query.AddField(adminUser);

        var input = new InputObjectGraphType { Name = "UpdateAdminUserInput" };
        input.AddField(new FieldType { Name = "id", ResolvedType = new NonNullGraphType(new GraphQLTypeReference("ID")) });
        input.AddField(new FieldType { Name = "displayName", ResolvedType = new GraphQLTypeReference("String") });
        input.AddField(new FieldType { Name = "clientMutationId", ResolvedType = new GraphQLTypeReference("String") });
        schema.RegisterType(input);
        var payload = new ObjectGraphType { Name = "UpdateAdminUserPayload" };
        payload.AddField(Field("adminUser", new GraphQLTypeReference("AdminUser"), context => ((UpdatePayload)context.Source!).Profile));
        payload.AddField(Field("clientMutationId", new GraphQLTypeReference("String"), context => ((UpdatePayload)context.Source!).ClientMutationId));
        schema.RegisterType(payload);
        schema.Mutation ??= new ObjectGraphType { Name = "RootMutation" };
        schema.Mutation.AddField(new FieldType
        {
            Name = "updateAdminUser",
            ResolvedType = new GraphQLTypeReference("UpdateAdminUserPayload"),
            Arguments = new QueryArguments(new QueryArgument(new NonNullGraphType(new GraphQLTypeReference("UpdateAdminUserInput"))) { Name = "input" }),
            Resolver = new FuncFieldResolver<object>(async context =>
            {
                RequireAdmin();
                var values = (IDictionary<string, object?>)context.Arguments!["input"].Value!;
                var id = GlobalId.EntityIdOf(Lookup(values, "id"), "User") ?? throw new GraphQLInputException("Invalid profile id.");
                var changes = new Dictionary<string, object?>();
                if (values.TryGetValue("displayName", out var name))
                {
                    changes["displayName"] = name ?? throw new GraphQLInputException("Profile fields cannot be null.");
                }

                var result = await gateway().UpdateAsync("User", id, changes, context.CancellationToken).ConfigureAwait(false);
                return new UpdatePayload(result.Entity is User user ? ProfileOf(user) : null, Lookup(values, "clientMutationId") as string);
            }),
        });
        return schema;
    }

    /// <summary>The generated manifest with the application's edits: no databaseId, a public author, and item counts on pages.</summary>
    public static GraphQLManifest Manifest(IServiceProvider services)
    {
        var generated = GraphQLManifestFactory.Create();
        var objects = new Dictionary<string, ObjectTypeEntry>();
        foreach (var (name, entry) in generated.Objects)
        {
            var fields = entry.Fields.Where(pair => pair.Key != "databaseId").ToDictionary(pair => pair.Key, pair => pair.Value);
            fields["author"] = new FieldEntry("author", new GraphQLType("Author", false, false), null, null, FieldEncoding.Value, null,
                async (source, token) => await AuthorOf(source, token).ConfigureAwait(false));
            if (name == "Page")
            {
                fields["itemCount"] = new FieldEntry("itemCount", new GraphQLType("Int", true, false), null, null, FieldEncoding.Value, null,
                    async (source, token) => await CountItems(services, (Page)source, false, token).ConfigureAwait(false));
                fields["publishedItemCount"] = new FieldEntry("publishedItemCount", new GraphQLType("Int", true, false), null, null, FieldEncoding.Value, null,
                    async (source, token) => await CountItems(services, (Page)source, true, token).ConfigureAwait(false));
            }

            objects[name] = new ObjectTypeEntry(entry.Name, entry.Entity, fields, entry.IsInstance, entry.Connections, entry.Description, entry.Interfaces);
        }

        return new GraphQLManifest(objects, generated.Enums, generated.Mutations, generated.Roots, generated.Queries);
    }

    private static object? Lookup(IDictionary<string, object?> values, string key) => values.TryGetValue(key, out var value) ? value : null;

    private sealed record Profile(string Id, string Username, string DisplayName);

    private sealed record UpdatePayload(Profile? Profile, string? ClientMutationId);

    private static FieldType Field(string name, IGraphType type, Func<IResolveFieldContext, object?> read) =>
        new() { Name = name, ResolvedType = type, Resolver = new FuncFieldResolver<object>(context => read(context)) };

    private static ViewerDto? Viewer(IResolveFieldContext context) => context.Source as ViewerDto;

    /// <summary>The signed-in staff member as the schema shows them; the role is the wire value, which the enum maps.</summary>
    public static ViewerDto? ViewerOf(Actor actor) =>
        actor.User is null || !actor.IsAuthenticated ? null : new ViewerDto(GlobalId.Encode("User", actor.User.Id), actor.User.DisplayName, actor.User.Role.ToWire());

    private static Profile ProfileOf(User user) => new(GlobalId.Encode("User", user.Id), user.Username, user.DisplayName);

    private static void RequireAdmin()
    {
        if (!RequestViewerProvider.Actor.HasRole("admin"))
        {
            throw new GraphQLInputException("Admin permission is required.");
        }
    }

    /// <summary>Read from trusted storage: visitors cannot read User, and the projection is the display name only.</summary>
    private static async ValueTask<object?> AuthorOf(object row, CancellationToken token)
    {
        using var scope = RequestViewerProvider.Use(Actor.Operator);
        var user = row switch
        {
            Page page => await page.GetAuthorAsync(token).ConfigureAwait(false),
            PageItem item => await item.GetAuthorAsync(token).ConfigureAwait(false),
            _ => null,
        };
        return user is null ? null : new Author(user.DisplayName);
    }

    /// <summary>The items of a page the viewer can read, optionally only the published ones.</summary>
    private static async ValueTask<object?> CountItems(IServiceProvider services, Page page, bool published, CancellationToken token)
    {
        var criteria = Criteria.For("PageItem").LinkedTo(EdgeFilter.Back("PageItem", "page", page.Id));
        if (published)
        {
            criteria = criteria.Where(Filter.Equal("status", "published"));
        }

        var runtime = services.GetRequiredService<Elephentity.Runtime.Gateway.Runtime>();
        return await runtime.Queries().Of(services.GetRequiredService<PageItemHydrator>(), criteria).CountAsync(token).ConfigureAwait(false);
    }
}
