using System.Globalization;
using System.Text.RegularExpressions;

namespace Hsimah.Acceptance.Static;

// The site palette (client/src/styles/global.css) must work for colour-blind visitors: every pair of tones stays distinguishable
// under simulated protanopia, deuteranopia and tritanopia (Machado et al. 2009, full severity), measured as CIEDE2000 colour
// difference. Contrast stays WCAG AA in light and dark.
public partial class PaletteTests
{
    private static readonly string Css = File.ReadAllText(Path.Combine(Env.RepoRoot, "client/src/styles/global.css"));
    private static readonly string[] Tones = ["green", "orange", "blue", "berry"];
    private const double MinDifference = 10;

    private static readonly Dictionary<string, double[][]> Simulations = new()
    {
        ["protanopia"] = [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
        ["deuteranopia"] = [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
        ["tritanopia"] = [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
    };

    private static string Variable(string name)
    {
        var match = Regex.Match(Css, $@"--{Regex.Escape(name)}:\s*([^;]+);");
        return match.Success ? match.Groups[1].Value.Trim() : throw new InvalidOperationException($"global.css defines --{name}");
    }

    private static (string Light, string Dark) LightDark(string name)
    {
        var value = Variable(name);
        var pair = LightDarkPattern().Match(value);
        return pair.Success ? (pair.Groups[1].Value, pair.Groups[2].Value) : throw new InvalidOperationException($"--{name} is light-dark(#light, #dark), not {value}");
    }

    private static double[] Linear(string hex) => new[] { 1, 3, 5 }.Select(i =>
    {
        var c = int.Parse(hex.AsSpan(i, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture) / 255.0;
        return c <= 0.04045 ? c / 12.92 : Math.Pow((c + 0.055) / 1.055, 2.4);
    }).ToArray();

    private static double Luminance(double[] rgb) => (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]);

    private static double Contrast(string a, string b)
    {
        var sorted = new[] { Luminance(Linear(a)), Luminance(Linear(b)) }.OrderByDescending(x => x).ToArray();
        return (sorted[0] + 0.05) / (sorted[1] + 0.05);
    }

    private static double[] Simulate(double[] rgb, double[][] matrix) =>
        matrix.Select(row => Math.Min(1, Math.Max(0, (row[0] * rgb[0]) + (row[1] * rgb[1]) + (row[2] * rgb[2])))).ToArray();

    private static double[] Lab(double[] rgb)
    {
        static double F(double t) => t > 0.008856 ? Math.Cbrt(t) : (7.787 * t) + (16.0 / 116);
        var x = F(((0.4124 * rgb[0]) + (0.3576 * rgb[1]) + (0.1805 * rgb[2])) / 0.95047);
        var y = F(Luminance(rgb));
        var z = F(((0.0193 * rgb[0]) + (0.1192 * rgb[1]) + (0.9505 * rgb[2])) / 1.08883);
        return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
    }

    private static double Ciede2000(double[] first, double[] second)
    {
        double l1 = first[0], a1 = first[1], b1 = first[2], l2 = second[0], a2 = second[1], b2 = second[2];
        const double rad = Math.PI / 180;
        var cBar = (Math.Sqrt((a1 * a1) + (b1 * b1)) + Math.Sqrt((a2 * a2) + (b2 * b2))) / 2;
        var g = 0.5 * (1 - Math.Sqrt(Math.Pow(cBar, 7) / (Math.Pow(cBar, 7) + Math.Pow(25, 7))));
        double ap1 = (1 + g) * a1, ap2 = (1 + g) * a2;
        double cp1 = Math.Sqrt((ap1 * ap1) + (b1 * b1)), cp2 = Math.Sqrt((ap2 * ap2) + (b2 * b2));
        static double Hue(double b, double a, double rad) => ((Math.Atan2(b, a) / rad) + 360) % 360;
        double hp1 = Hue(b1, ap1, rad), hp2 = Hue(b2, ap2, rad);
        var dh = hp2 - hp1;
        if (cp1 * cp2 == 0)
        {
            dh = 0;
        }
        else if (dh > 180)
        {
            dh -= 360;
        }
        else if (dh < -180)
        {
            dh += 360;
        }

        var dH = 2 * Math.Sqrt(cp1 * cp2) * Math.Sin(dh / 2 * rad);
        var lBar = (l1 + l2) / 2;
        var cpBar = (cp1 + cp2) / 2;
        var hBar = hp1 + hp2;
        if (cp1 * cp2 != 0)
        {
            hBar = Math.Abs(hp1 - hp2) <= 180 ? hBar / 2 : hBar < 360 ? (hBar + 360) / 2 : (hBar - 360) / 2;
        }

        var t = 1 - (0.17 * Math.Cos((hBar - 30) * rad)) + (0.24 * Math.Cos(2 * hBar * rad)) + (0.32 * Math.Cos(((3 * hBar) + 6) * rad)) - (0.2 * Math.Cos(((4 * hBar) - 63) * rad));
        var sl = 1 + (0.015 * Math.Pow(lBar - 50, 2) / Math.Sqrt(20 + Math.Pow(lBar - 50, 2)));
        var sc = 1 + (0.045 * cpBar);
        var sh = 1 + (0.015 * cpBar * t);
        var rt = -2 * Math.Sqrt(Math.Pow(cpBar, 7) / (Math.Pow(cpBar, 7) + Math.Pow(25, 7))) * Math.Sin(60 * Math.Exp(-Math.Pow((hBar - 275) / 25, 2)) * rad);
        double dl = (l2 - l1) / sl, dc = (cp2 - cp1) / sc;
        return Math.Sqrt((dl * dl) + (dc * dc) + Math.Pow(dH / sh, 2) + (rt * dc * (dH / sh)));
    }

    private static List<string> ClosestPairs(Dictionary<string, string> colours)
    {
        var problems = new List<string>();
        foreach (var (vision, matrix) in Simulations)
        {
            var names = colours.Keys.ToList();
            for (var i = 0; i < names.Count; i++)
            {
                for (var j = i + 1; j < names.Count; j++)
                {
                    var difference = Ciede2000(Lab(Simulate(Linear(colours[names[i]]), matrix)), Lab(Simulate(Linear(colours[names[j]]), matrix)));
                    if (difference < MinDifference)
                    {
                        problems.Add($"{vision}: {names[i]}/{names[j]} ΔE {difference.ToString("F1", CultureInfo.InvariantCulture)}");
                    }
                }
            }
        }

        return problems;
    }

    [Fact]
    public void Home_tiles_are_distinguishable_with_colour_blindness_and_carry_readable_white_text()
    {
        var tiles = Tones.ToDictionary(tone => tone, tone => Variable($"site-tile-{tone}"));
        foreach (var (tone, hex) in tiles)
        {
            Assert.True(Contrast(hex, "#ffffff") >= 4.5, $"white on {tone}");
        }

        Assert.Equal(Array.Empty<string>(), ClosestPairs(tiles).ToArray());
    }

    [Theory]
    [InlineData("light")]
    [InlineData("dark")]
    public void Navigation_tones_are_distinguishable_with_colour_blindness_and_readable(string scheme)
    {
        string Pick((string Light, string Dark) pair) => scheme == "light" ? pair.Light : pair.Dark;
        var canvas = Pick(LightDark("site-canvas"));
        var tones = Tones.ToDictionary(tone => tone, tone => Pick(LightDark($"site-{tone}")));
        foreach (var (tone, hex) in tones)
        {
            Assert.True(Contrast(hex, canvas) >= 4.5, $"{tone} on the {scheme} canvas");
        }

        // Links without a tone use the scheme's text colour, so tones must differ from it too.
        var all = new Dictionary<string, string>(tones) { ["text"] = scheme == "light" ? "#000000" : "#ffffff" };
        Assert.Equal(Array.Empty<string>(), ClosestPairs(all).ToArray());
    }

    [GeneratedRegex(@"^light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)$", RegexOptions.IgnoreCase)]
    private static partial Regex LightDarkPattern();
}
