<?php
declare(strict_types=1);
namespace Hsimah;

final class SiteContent {
    /** Replace editable content; operator accounts and credentials are preserved. */
    public static function replace(App $app): void {
        $source=file_get_contents(dirname(__DIR__,2).'/content/pages.json');
        if ($source===false) throw new \RuntimeException('Could not read site content.');
        /** @var list<array{title:string,slug:string,excerpt:string,content:string}> $pages */
        $pages=json_decode($source,true,512,JSON_THROW_ON_ERROR);
        $app->db->transaction(function() use($app,$pages): void {
            foreach (['hsimah_post','hsimah_product','hsimah_page'] as $table) $app->db->execute('DELETE FROM '.$table);
            foreach ($pages as $page) {
                $created=$app->runtime->create('Page',$page);
                $app->runtime->runAction('Page','publish',$created->id,[]);
            }
        });
    }
}
