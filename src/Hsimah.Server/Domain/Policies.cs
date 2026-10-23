using Elephentity.Runtime.Policy;
using Elephentity.Runtime.Storage;
using Microsoft.Extensions.DependencyInjection;
using Hsimah.Entity;
using Hsimah.Entity.Contract;
using Hsimah.Entity.Enums;
using Hsimah.Entity.Pattern;
using Hsimah.Entity.Pattern.Contract;

namespace Hsimah.Domain;

public sealed class ContentStaff : IPublishableContentStaffWritePolicy
{
    public ValueTask<PolicyDecision> DecideAsync(IPublishable? entity, IWriteContext context, IViewer viewer, CancellationToken cancellationToken = default) =>
        ValueTask.FromResult(viewer.HasRole("admin") || (viewer.HasRole("editor") && context.Operation != WriteOperation.Delete)
            ? PolicyDecision.Allow() : PolicyDecision.Deny("Staff permission is required."));
}

public sealed class ContentVisibility(IServiceProvider services) : IPublishableContentVisibilityReadPolicy
{
    public async ValueTask<PolicyDecision> DecideAsync(IPublishable entity, IViewer viewer, CancellationToken cancellationToken = default)
    {
        var staff = viewer.HasRole("admin") || viewer.HasRole("editor");
        // An item is visible to visitors only while its page is published too.
        var visible = entity.Status == PublicationStatus.Published;
        if (visible && !staff && entity is PageItem item)
        {
            // One pair of queries per request, not a page lookup per row: a list of 100 items would otherwise cost 200 round trips.
            var hidden = await RequestViewerProvider.State.HiddenItems(() => HiddenItems(cancellationToken)).ConfigureAwait(false);
            visible = !hidden.Contains(item.Id.ToString());
        }

        return visible || staff ? PolicyDecision.Allow() : PolicyDecision.Deny("Content is unavailable.");
    }

    private async Task<HashSet<string>> HiddenItems(CancellationToken cancellationToken)
    {
        var runtime = services.GetRequiredService<Elephentity.Runtime.Gateway.Runtime>();
        using var scope = RequestViewerProvider.Use(Actor.Operator);
        var unpublished = await runtime.Queries().Of(services.GetRequiredService<PageHydrator>(), Criteria.For("Page").Where(Filter.NotEqual("status", "published")))
            .AllAsync(cancellationToken).ConfigureAwait(false);
        if (unpublished.Count == 0)
        {
            return [];
        }

        var items = Criteria.For("PageItem").LinkedTo(EdgeFilter.Back("PageItem", "page", [.. unpublished.Select(page => page.Id)]));
        var hidden = await runtime.Queries().Of(services.GetRequiredService<PageItemHydrator>(), items).AllAsync(cancellationToken).ConfigureAwait(false);
        return [.. hidden.Select(item => item.Id.ToString())];
    }
}

public sealed class StaffProfile : IUserStaffProfileReadPolicy
{
    public ValueTask<PolicyDecision> DecideAsync(User entity, IViewer viewer, CancellationToken cancellationToken = default) =>
        ValueTask.FromResult(viewer.HasRole("admin") || (viewer.IsAuthenticated && entity.Id.ToString() == viewer.Id)
            ? PolicyDecision.Allow() : PolicyDecision.Deny("Profile is unavailable."));
}

public sealed class AdminAccounts : IUserAdminAccountsWritePolicy
{
    public ValueTask<PolicyDecision> DecideAsync(User? entity, UserWriteContext context, IViewer viewer, CancellationToken cancellationToken = default) =>
        ValueTask.FromResult(viewer.HasRole("admin") ? PolicyDecision.Allow() : PolicyDecision.Deny("Admin permission is required."));
}
