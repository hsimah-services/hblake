using Microsoft.Playwright;

namespace Hsimah.Acceptance.Lib;

/// <summary>A test with its own browser context and page; a failure leaves a screenshot in test-results/.</summary>
public abstract class BrowserTest : IAsyncLifetime
{
    protected IBrowserContext Context { get; private set; } = null!;

    protected IPage Page { get; private set; } = null!;

    /// <summary>Context options for this test; override for a phone, a colour scheme or reduced motion.</summary>
    protected virtual BrowserNewContextOptions ContextOptions() => new();

    public virtual async ValueTask InitializeAsync()
    {
        Context = await Browsers.NewContextAsync(ContextOptions());
        Context.SetDefaultTimeout(30_000);
        Page = await Context.NewPageAsync();
    }

    public virtual async ValueTask DisposeAsync()
    {
        if (TestContext.Current.TestState?.Result == TestResult.Failed)
        {
            var directory = Path.Combine(Env.RepoRoot, "tests", "Hsimah.Acceptance", "test-results");
            Directory.CreateDirectory(directory);
            var name = string.Concat((TestContext.Current.Test?.TestDisplayName ?? "test").Select(c => char.IsLetterOrDigit(c) ? c : '-'));
            try
            {
                await Page.ScreenshotAsync(new PageScreenshotOptions { Path = Path.Combine(directory, name[..Math.Min(100, name.Length)] + ".png"), FullPage = true });
            }
            catch (PlaywrightException)
            {
            }
        }

        await Context.CloseAsync();
    }
}
