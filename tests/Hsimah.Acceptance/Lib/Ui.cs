using System.Text.RegularExpressions;
using Microsoft.Playwright;
using static Microsoft.Playwright.Assertions;

namespace Hsimah.Acceptance.Lib;

public static class Ui
{
    /// <summary>A case-insensitive regular expression, as written in a JavaScript /pattern/i.</summary>
    public static Regex Rx(string pattern) => new(pattern, RegexOptions.IgnoreCase);

    /// <summary>A case-sensitive regular expression.</summary>
    public static Regex RxCs(string pattern) => new(pattern);

    /// <summary>Signs the browser context in through the HTTP contract, so UI tests start authenticated.</summary>
    public static async Task SignIn(IPage page)
    {
        var csrf = await page.APIRequest.GetAsync("/auth/csrf");
        Assert.Equal(200, csrf.Status);
        var token = (await csrf.JsonAsync())!.Value.GetProperty("token").GetString()!;
        var response = await page.APIRequest.PostAsync("/auth/login", new APIRequestContextOptions
        {
            DataObject = new { username = Env.Username, password = Env.Password },
            Headers = new Dictionary<string, string> { ["X-CSRF-Token"] = token },
        });
        Assert.True(response.Status == 200, $"operator login failed: {await response.TextAsync()}");
    }

    /// <summary>The rendered "not found" state for unknown or unpublished public content.</summary>
    public static ILocator NotFound(IPage page) => page.GetByRole(AriaRole.Heading, new() { NameRegex = Rx("not found") });

    /// <summary>Presses Tab until <paramref name="target" /> has focus, failing after <paramref name="max" /> presses.</summary>
    public static async Task TabTo(IPage page, ILocator target, int max = 12)
    {
        for (var i = 0; i < max; i++)
        {
            if (await target.EvaluateAsync<bool>("element => element === document.activeElement"))
            {
                return;
            }

            await page.Keyboard.PressAsync("Tab");
        }

        await Expect(target).ToBeFocusedAsync();
    }

    private static readonly Regex ForbiddenInputs = new(@"^\s*(id|status|publication status|published|published at|created|created at|updated|updated at|role|active)\s*$", RegexOptions.IgnoreCase);

    /// <summary>Form controls whose label suggests a field the UI must never accept as input.</summary>
    public static ILocator ForbiddenControls(IPage page, Regex? names = null)
    {
        names ??= ForbiddenInputs;
        AriaRole[] roles = [AriaRole.Textbox, AriaRole.Combobox, AriaRole.Checkbox, AriaRole.Switch, AriaRole.Radio, AriaRole.Spinbutton, AriaRole.Listbox, AriaRole.Radiogroup];
        return roles.Select(role => page.GetByRole(role, new() { NameRegex = names })).Aggregate((all, next) => all.Or(next));
    }

    /// <summary>A save/create confirmation announced to assistive technology.</summary>
    public static ILocator Confirmation(IPage page) =>
        page.GetByRole(AriaRole.Status).Or(page.GetByRole(AriaRole.Alert)).Filter(new() { HasTextRegex = Rx("saved|created|updated") });

    /// <summary>An announced error, in an alert region or error summary.</summary>
    public static ILocator AnnouncedError(IPage page) => page.GetByRole(AriaRole.Alert);

    /// <summary>Whether injected markup ran; markdown fixtures try to set window.__xss.</summary>
    public static async Task<bool> XssFired(IPage page) => await page.EvaluateAsync<bool>("() => window.__xss !== undefined");

    /// <summary>
    /// WCAG contrast ratio between an element's text colour and the colour actually painted behind it: the nearest opaque ancestor
    /// background, else the canvas for the page's colour scheme.
    /// </summary>
    public static async Task<double> ContrastOf(ILocator target) => await target.EvaluateAsync<double>("""
        element => {
          const rgb = value => {
            const parts = value.match(/[\d.]+/g).map(Number);
            return [parts[0], parts[1], parts[2], parts[3] ?? 1];
          };
          // The page canvas follows the root element's colour scheme, not the element's.
          const canvas = () => {
            const probe = document.createElement('span');
            probe.style.setProperty('background-color', 'Canvas');
            document.documentElement.append(probe);
            const resolved = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return resolved;
          };
          let background = rgb(canvas());
          for (let node = element; node; node = node.parentElement) {
            const value = rgb(getComputedStyle(node).backgroundColor);
            if (value[3] > 0.99) {
              background = value;
              break;
            }
          }
          const luminance = ([r, g, b]) => {
            const channel = c => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
            return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
          };
          const [a, b] = [luminance(rgb(getComputedStyle(element).color)), luminance(background)].sort((x, y) => y - x);
          return (a + 0.05) / (b + 0.05);
        }
        """);
}
