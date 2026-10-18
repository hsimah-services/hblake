<?php
declare(strict_types=1);
namespace Hsimah;

/**
 * The Atom feed of published News (posts), newest first. It runs the public posts query
 * as an anonymous visitor, so read policies keep drafts out.
 */
final class NewsFeed {
    private const QUERY = 'query NewsFeed { posts(first: 20) { nodes { title slug excerpt status publishedAt updatedAt author { displayName } } } }';

    public static function render(App $app, string $origin): string {
        $result=GraphQLEndpoint::execute($app,self::QUERY,null,'NewsFeed');
        $data=is_array($result['data'] ?? null) ? $result['data'] : [];
        $posts=is_array($data['posts'] ?? null) ? $data['posts'] : [];
        $nodes=array_values(array_filter(is_array($posts['nodes'] ?? null) ? $posts['nodes'] : [], static fn(mixed $node): bool => is_array($node) && ($node['status'] ?? null)==='PUBLISHED'));
        $updated=array_reduce($nodes, static fn(string $latest, array $node): string => max($latest,self::text($node,'updatedAt')), '1970-01-01T00:00:00+00:00');
        $xml=new \XMLWriter(); $xml->openMemory(); $xml->setIndent(true);
        $xml->startDocument('1.0','UTF-8');
        $xml->startElement('feed'); $xml->writeAttribute('xmlns','http://www.w3.org/2005/Atom');
        $xml->writeElement('title','hblake News');
        $xml->writeElement('id',$origin.'/news');
        $xml->writeElement('updated',$updated);
        self::link($xml,$origin.'/news/feed.xml','self','application/atom+xml');
        self::link($xml,$origin.'/news','alternate','text/html');
        foreach ($nodes as $node) {
            $url=$origin.'/news/'.rawurlencode(self::text($node,'slug'));
            $xml->startElement('entry');
            $xml->writeElement('title',self::text($node,'title'));
            $xml->writeElement('id',$url);
            self::link($xml,$url,'alternate','text/html');
            $xml->writeElement('published',self::text($node,'publishedAt'));
            $xml->writeElement('updated',self::text($node,'updatedAt'));
            $author=is_array($node['author'] ?? null) ? $node['author'] : [];
            $xml->startElement('author'); $xml->writeElement('name',self::text($author,'displayName') ?: 'hblake'); $xml->endElement();
            if (self::text($node,'excerpt')!=='') { $xml->startElement('summary'); $xml->writeAttribute('type','text'); $xml->text(self::text($node,'excerpt')); $xml->endElement(); }
            $xml->endElement();
        }
        $xml->endElement(); $xml->endDocument();
        return $xml->outputMemory();
    }

    /** @param array<mixed> $row */
    private static function text(array $row, string $key): string { return is_string($row[$key] ?? null) ? $row[$key] : ''; }

    private static function link(\XMLWriter $xml, string $href, string $rel, string $type): void {
        $xml->startElement('link'); $xml->writeAttribute('rel',$rel); $xml->writeAttribute('type',$type); $xml->writeAttribute('href',$href); $xml->endElement();
    }
}
