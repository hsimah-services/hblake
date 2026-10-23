using Microsoft.Playwright;

namespace Hsimah.Acceptance.Lib;

/// <summary>One Playwright driver and one Chromium for the whole run; each test gets its own context.</summary>
public static class Browsers
{
    private static readonly SemaphoreSlim Gate = new(1, 1);
    private static IPlaywright? playwright;
    private static IBrowser? browser;

    static Browsers() => Assertions.SetDefaultExpectTimeout(10_000);

    public static async Task<IPlaywright> PlaywrightAsync()
    {
        await Gate.WaitAsync();
        try
        {
            return playwright ??= await Playwright.CreateAsync();
        }
        finally
        {
            Gate.Release();
        }
    }

    public static async Task<IBrowser> ChromiumAsync()
    {
        var driver = await PlaywrightAsync();
        await Gate.WaitAsync();
        try
        {
            return browser ??= await driver.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });
        }
        finally
        {
            Gate.Release();
        }
    }

    /// <summary>A "Desktop Chrome" context, as the TypeScript suite used.</summary>
    public static async Task<IBrowserContext> NewContextAsync(BrowserNewContextOptions? options = null)
    {
        var driver = await PlaywrightAsync();
        var chromium = await ChromiumAsync();
        var device = driver.Devices["Desktop Chrome"];
        options ??= new BrowserNewContextOptions();
        options.BaseURL = Env.BaseUrl;
        options.UserAgent ??= device.UserAgent;
        options.ViewportSize ??= device.ViewportSize;
        options.DeviceScaleFactor ??= device.DeviceScaleFactor;
        options.HasTouch ??= device.HasTouch;
        options.IsMobile ??= device.IsMobile;
        return await chromium.NewContextAsync(options);
    }
}
