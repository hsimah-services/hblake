namespace Hsimah.Acceptance.Http;

// Password change (User.md): POST /auth/password with {currentPassword, newPassword} and X-CSRF-Token, for the signed-in account
// only. Credentials never pass through GraphQL. Every test leaves ADMIN_PASSWORD working, because later tests sign in with it.
// This file makes three failed attempts; a successful login resets the rate limit.
public class PasswordTests
{
    private static string NewPassword => $"{Env.Password}-changed";

    private static async Task<int> SignsIn(string password)
    {
        await using var api = await Api.Anonymous();
        return (await api.Login(Env.Username, password)).Status;
    }

    [Fact]
    public async Task A_password_change_needs_a_signed_in_session_and_the_CSRF_token()
    {
        await using (var anonymous = await Api.Anonymous())
        {
            Assert.Equal(401, (await anonymous.ChangePassword(Env.Password, NewPassword)).Status);
        }

        await using (var operatorSession = await Api.Operator())
        {
            Assert.Equal(403, (await operatorSession.ChangePassword(Env.Password, NewPassword, csrfHeader: false)).Status);
        }

        Assert.Equal(200, await SignsIn(Env.Password));
    }

    [Fact]
    public async Task A_wrong_current_password_or_a_short_new_password_changes_nothing()
    {
        await using (var operatorSession = await Api.Operator())
        {
            var wrong = await operatorSession.ChangePassword($"{Env.Password}-wrong", NewPassword);
            Assert.Equal(401, wrong.Status);
            var tooShort = await operatorSession.ChangePassword(Env.Password, "too-short");
            Assert.Equal(400, tooShort.Status);
            Assert.Matches("12 characters", (await tooShort.JsonAsync())!.Value.GetProperty("error").GetString()!);
            Assert.NotNull(await operatorSession.Viewer());
        }

        Assert.Equal(200, await SignsIn(Env.Password));
    }

    [Fact]
    public async Task A_new_password_replaces_the_old_one_and_signs_out_other_sessions()
    {
        await using var changer = await Api.Operator();
        await using var other = await Api.Operator();
        try
        {
            var response = await changer.ChangePassword(Env.Password, NewPassword);
            Assert.True(response.Status == 200, await response.TextAsync());
            Assert.Matches("no-store", response.Headers.GetValueOrDefault("cache-control") ?? "");
            Assert.NotNull(await changer.Viewer());
            Assert.Null(await other.Viewer());
            Assert.Equal(401, await SignsIn(Env.Password));
            Assert.Equal(200, await SignsIn(NewPassword));
        }
        finally
        {
            var restore = await changer.ChangePassword(NewPassword, Env.Password);
            Assert.Equal(200, restore.Status);
        }

        Assert.Equal(200, await SignsIn(Env.Password));
    }
}
