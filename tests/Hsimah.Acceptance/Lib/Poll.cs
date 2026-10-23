namespace Hsimah.Acceptance.Lib;

/// <summary>Retrying assertions over values the page or API settles on, as Playwright's expect.poll does.</summary>
public static class Poll
{
    public static async Task Until(Func<Task<bool>> check, string message = "the condition was not met in time", int timeoutMs = 10_000)
    {
        var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
        while (DateTime.UtcNow < deadline)
        {
            if (await check())
            {
                return;
            }

            await Task.Delay(100);
        }

        Assert.Fail(message);
    }

    public static async Task Equals<T>(Func<Task<T>> read, T expected, int timeoutMs = 10_000)
    {
        T? last = default;
        var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
        while (DateTime.UtcNow < deadline)
        {
            last = await read();
            if (EqualityComparer<T>.Default.Equals(last, expected))
            {
                return;
            }

            await Task.Delay(100);
        }

        Assert.Fail($"expected {expected?.ToString() ?? "null"}, last value {last?.ToString() ?? "null"}");
    }
}
