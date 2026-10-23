using Elephentity.Runtime.Identity;
using Elephentity.Runtime.Mutation;
using Elephentity.Runtime.Policy;
using Hsimah.Domain;
using Hsimah.Entity;
using Hsimah.Entity.Enums;

namespace Hsimah.Tests;

public class PolicyTests
{
    private sealed class Write(WriteOperation operation) : IWriteContext
    {
        public string Entity => "Page";

        public WriteOperation Operation => operation;

        public IReadOnlyList<ActionCall> Actions => [];

        public string? Action => null;

        public IReadOnlyDictionary<string, object?> Arguments => new Dictionary<string, object?>();

        public IMutationContext? Mutation => null;
    }

    private static User UserOf(UserRole role, bool active) =>
        User.Of(EntityId.Of(1), DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, "operator", "Operator", role, active);

    [Fact]
    public async Task An_editor_may_write_content_but_cannot_delete_or_edit_accounts()
    {
        var editor = new Actor(UserOf(UserRole.Editor, true));
        Assert.Equal(PolicyOutcome.Allow, (await new ContentStaff().DecideAsync(null, new Write(WriteOperation.Update), editor)).Outcome);
        Assert.Equal(PolicyOutcome.Deny, (await new ContentStaff().DecideAsync(null, new Write(WriteOperation.Delete), editor)).Outcome);
        var profile = UserWriteContext.Of(new Write(WriteOperation.Update));
        Assert.Equal(PolicyOutcome.Deny, (await new AdminAccounts().DecideAsync(null, profile, editor)).Outcome);
        Assert.Equal(PolicyOutcome.Allow, (await new AdminAccounts().DecideAsync(null, profile, new Actor(UserOf(UserRole.Admin, true)))).Outcome);
    }

    [Fact]
    public async Task An_inactive_admin_cannot_write()
    {
        var actor = new Actor(UserOf(UserRole.Admin, false));
        Assert.False(actor.IsAuthenticated);
        Assert.Equal(PolicyOutcome.Deny, (await new ContentStaff().DecideAsync(null, new Write(WriteOperation.Delete), actor)).Outcome);
    }
}
