using Hsimah.Domain;

namespace Hsimah.Tests;

public class RulesTests
{
    [Fact]
    public void Trust_boundaries()
    {
        Assert.True(Rules.Slug("valid-slug").IsOk);
        foreach (var slug in new[] { "Upper", "a--b", "../x", "", new string('a', 161) })
        {
            Assert.False(Rules.Slug(slug).IsOk, slug);
        }

        foreach (var url in new[] { "javascript:alert(1)", "http://example.test", "mailto:broken", "https://" })
        {
            Assert.False(Rules.Enquiry(url).IsOk, url);
        }

        Assert.True(Rules.Enquiry("https://example.test/contact").IsOk);
        Assert.True(Rules.Enquiry("mailto:operator@example.test").IsOk);
        Assert.True(Rules.Username("adminhabl").IsOk);
        foreach (var username in new[] { " adminhabl ", "AdminHabl", "ab", "-admin", "admin@example.test", "admin habl", new string('a', 33) })
        {
            Assert.False(Rules.Username(username).IsOk, username);
        }

        Assert.False(Rules.Password(new string('a', 11)).IsOk);
        Assert.True(Rules.Password(new string('a', 12)).IsOk);
        Assert.False(Rules.Title("   ").IsOk);
    }
}
