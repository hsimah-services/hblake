using Elephentity.GraphQL;
using Elephentity.Runtime.Gateway;
using Elephentity.Runtime.Identity;
using Elephentity.Runtime.Mutation;
using Elephentity.Runtime.Query;
using Hsimah.Domain;
using Hsimah.Entity;

namespace Hsimah;

/// <summary>
/// Rules that span an item and its page, applied to create and update inputs before the runtime sees them: an item belongs to a
/// page that holds items, takes that page's kind unless given one, and content records who wrote it. The author is not a GraphQL
/// input, so clients cannot choose it.
/// </summary>
public sealed class ApplicationGateway(IEntityGateway inner) : IEntityGateway
{
    public ValueTask<object?> FindAsync(string entity, EntityId id, CancellationToken cancellationToken = default) => inner.FindAsync(entity, id, cancellationToken);

    public IEntityQuery<object> All(string entity) => inner.All(entity);

    public ValueTask<object?> RunQueryAsync(string entity, string query, IReadOnlyDictionary<string, object?> args, CancellationToken cancellationToken = default) =>
        inner.RunQueryAsync(entity, query, args, cancellationToken);

    public async Task<MutationResult> CreateAsync(string entity, IReadOnlyDictionary<string, object?> input, CancellationToken cancellationToken = default)
    {
        var fields = new Dictionary<string, object?>(input);
        if (entity == "PageItem")
        {
            var page = await PageOf(fields.GetValueOrDefault("page"), cancellationToken).ConfigureAwait(false);
            if (!fields.ContainsKey("kind"))
            {
                fields["kind"] = page.DefaultItemKind;
            }
        }

        if (entity is "Page" or "PageItem" && RequestViewerProvider.Actor is { User: { } user } actor && actor.IsAuthenticated)
        {
            fields["author"] = user.Id.ToString();
        }

        return await inner.CreateAsync(entity, fields, cancellationToken).ConfigureAwait(false);
    }

    public async Task<MutationResult> UpdateAsync(string entity, EntityId id, IReadOnlyDictionary<string, object?> input, CancellationToken cancellationToken = default)
    {
        if (entity == "PageItem" && input.TryGetValue("page", out var page))
        {
            await PageOf(page, cancellationToken).ConfigureAwait(false);
        }

        return await inner.UpdateAsync(entity, id, input, cancellationToken).ConfigureAwait(false);
    }

    public Task DeleteAsync(string entity, EntityId id, CancellationToken cancellationToken = default) => inner.DeleteAsync(entity, id, cancellationToken);

    public Task<MutationResult> RunActionAsync(string entity, string action, EntityId id, IReadOnlyDictionary<string, object?> args, CancellationToken cancellationToken = default) =>
        inner.RunActionAsync(entity, action, id, args, cancellationToken);

    public Task<MutationResult> RunActionsAsync(string entity, EntityId id, IReadOnlyList<ActionCall> actions, CancellationToken cancellationToken = default) =>
        inner.RunActionsAsync(entity, id, actions, cancellationToken);

    private async Task<Page> PageOf(object? id, CancellationToken cancellationToken)
    {
        var entityId = id switch
        {
            EntityId known => known,
            string text when text.Length > 0 => EntityId.Of(text),
            _ => null,
        };
        var page = entityId is null ? null : await inner.FindAsync("Page", entityId, cancellationToken).ConfigureAwait(false);
        if (page is not Page found)
        {
            throw new GraphQLInputException("Choose an existing page for this item.");
        }

        return found.DefaultItemKind is null ? throw new GraphQLInputException("This page does not hold items.") : found;
    }
}
