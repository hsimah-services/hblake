using System.Text.Json.Nodes;

namespace Hsimah.Acceptance.Http;

// The single operator account (User.md, acceptance 4–6): an application-owned profile DTO of username and display name, editable
// only in displayName. The username is the login and is not editable. Every test restores the original display name.
public class ProfileTests : OperatorTest
{
    private const string Profile = "id username displayName";
    private const string Read = $"query Profile($id: ID!) {{ adminUser(id: $id) {{ {Profile} }} }}";
    private const string Update = $"mutation UpdateProfile($input: UpdateAdminUserInput!) {{ updateAdminUser(input: $input) {{ adminUser {{ {Profile} }} }} }}";

    private string id = null!;

    public override async ValueTask InitializeAsync()
    {
        await base.InitializeAsync();
        id = (await api.Viewer())!["id"]!.GetValue<string>();
    }

    public override async ValueTask DisposeAsync()
    {
        await api.GraphQL(Update, new { input = new { id, displayName = Env.DisplayName } });
        await base.DisposeAsync();
    }

    private static void ExpectProfile(JsonNode? node, string id, string displayName)
    {
        Assert.Equal(id, node!["id"]!.GetValue<string>());
        Assert.Equal(Env.Username, node["username"]!.GetValue<string>());
        Assert.Equal(displayName, node["displayName"]!.GetValue<string>());
    }

    [Fact]
    public async Task The_operator_reads_their_own_profile()
    {
        ExpectProfile((await api.Ok(Read, new { id }))["adminUser"], id, Env.DisplayName);
    }

    [Fact]
    public async Task Viewer_returns_the_allowlisted_identity_of_the_signed_in_operator()
    {
        var viewer = (await api.Viewer())!;
        Assert.Equal(id, viewer["id"]!.GetValue<string>());
        Assert.Equal(Env.DisplayName, viewer["displayName"]!.GetValue<string>());
        Assert.Equal("ADMIN", viewer["role"]!.GetValue<string>());
        Assert.Equal(3, viewer.AsObject().Count);
    }

    [Fact]
    public async Task The_display_name_can_be_changed()
    {
        var data = await api.Ok(Update, new { input = new { id, displayName = "Renamed Operator" } });
        ExpectProfile(data["updateAdminUser"]!["adminUser"], id, "Renamed Operator");
        Assert.Equal("Renamed Operator", (await api.Viewer())!["displayName"]!.GetValue<string>());
    }

    [Fact]
    public async Task A_blank_display_name_is_rejected()
    {
        foreach (var displayName in new[] { "", "   " })
        {
            Api.ExpectRejected(await api.GraphQL(Update, new { input = new { id, displayName } }));
        }

        Assert.Equal(Env.DisplayName, (await api.Ok(Read, new { id }))["adminUser"]!["displayName"]!.GetValue<string>());
    }

    [Fact]
    public async Task Username_email_role_and_active_cannot_be_changed_through_the_profile_API()
    {
        object[] attempts =
        [
            new Dictionary<string, object?> { ["id"] = id, ["username"] = "renamed" },
            new Dictionary<string, object?> { ["id"] = id, ["email"] = "operator@example.test" },
            new Dictionary<string, object?> { ["id"] = id, ["role"] = "EDITOR" },
            new Dictionary<string, object?> { ["id"] = id, ["active"] = false },
        ];
        foreach (var input in attempts)
        {
            Api.ExpectRejected(await api.GraphQL(Update, new { input }), System.Text.Json.JsonSerializer.Serialize(input));
        }

        Assert.Equal(Env.Username, (await api.Ok(Read, new { id }))["adminUser"]!["username"]!.GetValue<string>());
        Assert.Equal("ADMIN", (await api.Viewer())!["role"]!.GetValue<string>());
    }

    [Fact]
    public async Task The_profile_API_refuses_anonymous_writes()
    {
        await using (var anonymous = await Api.Anonymous())
        {
            Api.ExpectRejected(await anonymous.GraphQL(Update, new { input = new { id, displayName = "Anonymous edit" } }));
        }

        Assert.Equal(Env.DisplayName, (await api.Ok(Read, new { id }))["adminUser"]!["displayName"]!.GetValue<string>());
    }
}
