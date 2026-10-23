using Microsoft.Playwright;
using static Hsimah.Acceptance.Lib.Ui;
using static Microsoft.Playwright.Assertions;

namespace Hsimah.Acceptance.Ui;

// The operator settings screens (ui/admin.yml User): the detail shows the username and display name and changes the password; the
// edit form changes only the display name. Each test restores the profile and password through the API.
public class AdminProfileTests : BrowserTest
{
    private const string Restore = "mutation Restore($input: UpdateAdminUserInput!) { updateAdminUser(input: $input) { adminUser { id } } }";

    private static string NewPassword => $"{Env.Password}-from-settings";

    private Api api = null!;
    private string id = null!;

    public override async ValueTask InitializeAsync()
    {
        await base.InitializeAsync();
        api = await Api.Operator();
        id = (await api.Viewer())!["id"]!.GetValue<string>();
        await SignIn(Page);
    }

    public override async ValueTask DisposeAsync()
    {
        await api.GraphQL(Restore, new { input = new { id, displayName = Env.DisplayName } });
        await api.DisposeAsync();
        await base.DisposeAsync();
    }

    private string Detail() => $"/admin/users/{Uri.EscapeDataString(id)}";

    [Fact]
    public async Task Settings_show_the_username_and_display_name_with_no_role_status_or_email()
    {
        await Page.GotoAsync(Detail());
        var main = Page.GetByRole(AriaRole.Main);
        await Expect(main.GetByText(Env.DisplayName).First).ToBeVisibleAsync();
        await Expect(main.GetByText(Env.Username).First).ToBeVisibleAsync();
        await Expect(main.GetByText(Rx("email|role|active"))).ToHaveCountAsync(0);
        // The only inputs here are the password-change form's; the profile is edited elsewhere.
        await Expect(Page.GetByRole(AriaRole.Textbox, new() { NameRegex = Rx("username|display name|email") })).ToHaveCountAsync(0);
        await Expect(Page.GetByLabel("Current password")).ToHaveAttributeAsync("type", "password");
    }

    [Fact]
    public async Task The_profile_form_edits_only_the_display_name()
    {
        await Page.GotoAsync($"{Detail()}/edit");
        await Expect(Page.GetByLabel("Display name")).ToHaveValueAsync(Env.DisplayName);
        await Expect(Page.GetByRole(AriaRole.Textbox)).ToHaveCountAsync(1);
        await Expect(Page.GetByLabel(Rx("username|email"))).ToHaveCountAsync(0);
        await Expect(ForbiddenControls(Page)).ToHaveCountAsync(0);
        await Expect(Page.GetByLabel(Rx("password"))).ToHaveCountAsync(0);
    }

    [Fact]
    public async Task Saving_a_new_display_name_updates_the_profile()
    {
        await Page.GotoAsync($"{Detail()}/edit");
        await Page.GetByLabel("Display name").FillAsync("Profile Edited");
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^save") }).ClickAsync();
        await Expect(Confirmation(Page)).ToBeVisibleAsync();
        await PollAsync(async () => (await api.Viewer())?["displayName"]?.GetValue<string>(), "Profile Edited");
    }

    [Fact]
    public async Task A_blank_display_name_is_refused_with_an_announced_error_and_input_kept()
    {
        await Page.GotoAsync($"{Detail()}/edit");
        await Page.GetByLabel("Display name").FillAsync("   ");
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("^save") }).ClickAsync();
        await Expect(AnnouncedError(Page).First).ToBeVisibleAsync();
        await Expect(Page.GetByLabel("Display name")).ToHaveAttributeAsync("aria-invalid", "true");
        Assert.Equal(Env.DisplayName, (await api.Viewer())?["displayName"]?.GetValue<string>());
    }

    [Fact]
    public async Task The_admin_home_links_to_settings()
    {
        await Page.GotoAsync("/admin");
        await Page.GetByRole(AriaRole.Main).GetByRole(AriaRole.Link, new() { NameRegex = Rx("settings") }).ClickAsync();
        await Expect(Page).ToHaveURLAsync($"{Env.BaseUrl}{Detail()}");
        await Expect(Page.GetByRole(AriaRole.Main).GetByText(Env.Username).First).ToBeVisibleAsync();
    }

    [Fact]
    public async Task Mismatched_new_passwords_are_refused_before_anything_is_sent()
    {
        await Page.GotoAsync(Detail());
        await Page.GetByLabel("Current password").FillAsync(Env.Password);
        await Page.GetByLabel("New password", new() { Exact = true }).FillAsync(NewPassword);
        await Page.GetByLabel("Confirm new password").FillAsync($"{NewPassword}-typo");
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("change password") }).ClickAsync();
        await Expect(AnnouncedError(Page).First).ToBeVisibleAsync();
        await Expect(Page.GetByLabel("Confirm new password")).ToHaveAttributeAsync("aria-invalid", "true");
        Assert.NotNull(await api.Viewer());
    }

    [Fact]
    public async Task A_wrong_current_password_is_refused_with_an_announced_error()
    {
        await Page.GotoAsync(Detail());
        await Page.GetByLabel("Current password").FillAsync($"{Env.Password}-wrong");
        await Page.GetByLabel("New password", new() { Exact = true }).FillAsync(NewPassword);
        await Page.GetByLabel("Confirm new password").FillAsync(NewPassword);
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("change password") }).ClickAsync();
        await Expect(AnnouncedError(Page).First).ToContainTextAsync(Rx("current password"));
        Assert.NotNull(await api.Viewer());
    }

    [Fact]
    public async Task The_password_can_be_changed_from_settings()
    {
        await Page.GotoAsync(Detail());
        await Page.GetByLabel("Current password").FillAsync(Env.Password);
        await Page.GetByLabel("New password", new() { Exact = true }).FillAsync(NewPassword);
        await Page.GetByLabel("Confirm new password").FillAsync(NewPassword);
        await Page.GetByRole(AriaRole.Button, new() { NameRegex = Rx("change password") }).ClickAsync();
        await Expect(Confirmation(Page)).ToBeVisibleAsync();
        await Expect(Page.GetByLabel("Current password")).ToHaveValueAsync(string.Empty);
        Assert.Null(await api.Viewer());
        await using var changed = await Api.Anonymous();
        Assert.Equal(200, (await changed.Login(Env.Username, NewPassword)).Status);
        Assert.True((await changed.ChangePassword(NewPassword, Env.Password)).Status == 200, "restoring ADMIN_PASSWORD");
        // The restore in DisposeAsync needs a signed-in session again.
        await api.DisposeAsync();
        api = await Api.Operator();
    }

    private static async Task PollAsync(Func<Task<string?>> read, string expected)
    {
        string? last = null;
        var deadline = DateTime.UtcNow.AddSeconds(10);
        while (DateTime.UtcNow < deadline)
        {
            if ((last = await read()) == expected)
            {
                return;
            }

            await Task.Delay(100);
        }

        Assert.Fail($"expected {expected}, last value {last}");
    }
}
