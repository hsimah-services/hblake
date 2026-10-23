namespace Hsimah.Acceptance.Lib;

/// <summary>The environment tests/run.sh exports (tests/README.md).</summary>
public static class Env
{
    public static string BaseUrl { get; } = (Environment.GetEnvironmentVariable("BASE_URL") ?? "http://localhost:8080").TrimEnd('/');

    public static string RepoRoot { get; } = Environment.GetEnvironmentVariable("REPO_ROOT") ?? FindRoot();

    /// <summary>Unique per test run, so reruns against the same database never collide.</summary>
    public static string RunId { get; } = $"{Base36(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())}{Base36(Random.Shared.Next(1296))}";

    public static string Username => Required("ADMIN_USERNAME");

    public static string Password => Required("ADMIN_PASSWORD");

    public static string DisplayName => Environment.GetEnvironmentVariable("ADMIN_DISPLAY_NAME") ?? "Site Operator";

    private static string Base36(long value)
    {
        const string digits = "0123456789abcdefghijklmnopqrstuvwxyz";
        var text = new System.Text.StringBuilder();
        do
        {
            text.Insert(0, digits[(int)(value % 36)]);
            value /= 36;
        }
        while (value > 0);
        return text.ToString();
    }

    private static string Required(string name) =>
        Environment.GetEnvironmentVariable(name) is { Length: > 0 } value ? value : throw new InvalidOperationException($"{name} must be set; see tests/README.md.");

    private static string FindRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, "eleph.json")))
            {
                return directory.FullName;
            }
        }

        throw new InvalidOperationException("Could not find the repository root; set REPO_ROOT.");
    }
}
