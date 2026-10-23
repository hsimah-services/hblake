using System.Text;
using System.Text.Json.Nodes;
using System.Xml;
using Hsimah;
using GraphQL;
using GraphQL.Transport;
using Hsimah.Domain;

namespace Hsimah.Http;

/// <summary>
/// The Atom feed of the published items of the News page, newest first. It runs the public items query as an anonymous visitor, so
/// read policies keep drafts out.
/// </summary>
public static class NewsFeed
{
    private const string Query = "query NewsFeed { pageItemsOfPage(where: { page: \"news\" }, first: 20) { nodes { title slug excerpt status publishedAt updatedAt author { displayName } } } }";

    public static async Task<string> RenderAsync(IServiceProvider services, string origin, CancellationToken token)
    {
        var executor = services.GetRequiredService<HsimahExecutor>();
        JsonNode? result;
        using (RequestViewerProvider.Use(Actor.Visitor))
        {
            var executed = await executor.ExecuteAsync(new GraphQLRequest { Query = Query, OperationName = "NewsFeed" }, services, token).ConfigureAwait(false);
            result = JsonNode.Parse(executor.Serializer.Serialize(executed));
        }

        var nodes = (result?["data"]?["pageItemsOfPage"]?["nodes"] as JsonArray ?? [])
            .OfType<JsonObject>().Where(node => Text(node, "status") == "PUBLISHED").ToList();
        var updated = nodes.Select(node => Text(node, "updatedAt")).Prepend("1970-01-01T00:00:00+00:00").Max(StringComparer.Ordinal)!;

        var output = new StringBuilder();
        using (var xml = XmlWriter.Create(output, new XmlWriterSettings { Indent = true, Encoding = new UTF8Encoding(false), OmitXmlDeclaration = false }))
        {
            xml.WriteStartDocument();
            xml.WriteStartElement("feed", "http://www.w3.org/2005/Atom");
            xml.WriteElementString("title", "hblake News");
            xml.WriteElementString("id", origin + "/pages/news");
            xml.WriteElementString("updated", updated);
            Link(xml, origin + "/news/feed.xml", "self", "application/atom+xml");
            Link(xml, origin + "/pages/news", "alternate", "text/html");
            foreach (var node in nodes)
            {
                var url = origin + "/news/" + Uri.EscapeDataString(Text(node, "slug"));
                xml.WriteStartElement("entry");
                xml.WriteElementString("title", Text(node, "title"));
                xml.WriteElementString("id", url);
                Link(xml, url, "alternate", "text/html");
                xml.WriteElementString("published", Text(node, "publishedAt"));
                xml.WriteElementString("updated", Text(node, "updatedAt"));
                xml.WriteStartElement("author");
                var name = node["author"] is JsonObject author ? Text(author, "displayName") : string.Empty;
                xml.WriteElementString("name", name.Length > 0 ? name : "hblake");
                xml.WriteEndElement();
                if (Text(node, "excerpt").Length > 0)
                {
                    xml.WriteStartElement("summary");
                    xml.WriteAttributeString("type", "text");
                    xml.WriteString(Text(node, "excerpt"));
                    xml.WriteEndElement();
                }

                xml.WriteEndElement();
            }

            xml.WriteEndElement();
            xml.WriteEndDocument();
        }

        return output.ToString();
    }

    private static string Text(JsonObject row, string key) => row[key] is JsonValue value && value.TryGetValue<string>(out var text) ? text : string.Empty;

    private static void Link(XmlWriter xml, string href, string rel, string type)
    {
        xml.WriteStartElement("link");
        xml.WriteAttributeString("rel", rel);
        xml.WriteAttributeString("type", type);
        xml.WriteAttributeString("href", href);
        xml.WriteEndElement();
    }
}
