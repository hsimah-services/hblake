<?php
declare(strict_types=1);
namespace Hsimah\Tests;
use PHPUnit\Framework\TestCase;
use Eleph\SQLite\Database;
use Hsimah\{App, Actor, NewsFeed, Schema};
use GraphQL\GraphQL;
final class NewsFeedTest extends TestCase {
    public function testFeedListsOnlyPublishedArticlesWithEscapedText(): void {
        $db=new Database(':memory:'); $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        $staff=new App($db,new Actor(bootstrap:true));
        $staff->runtime->create('User',['username'=>'operator','displayName'=>'hblake','role'=>'admin','active'=>true]);
        $page=$staff->runtime->create('Page',['title'=>'News','slug'=>'news','content'=>'News.','defaultItemKind'=>'Article']);
        $staff->runtime->runAction('Page','publish',$page->id,[]);
        $schema=Schema::build($staff); $pageId=\Eleph\GraphQL\Relay\GlobalId::encode('Page',(string)$page->id->raw());
        $created=GraphQL::executeQuery($schema,'mutation($page:ID!) { createPageItem(input:{title:"Fish & <chips>",slug:"fish-chips",content:"Body.",excerpt:"A summary.",page:$page}) { pageItem { id } } }',variableValues:['page'=>$pageId])->toArray();
        $published=GraphQL::executeQuery($schema,'mutation($id:ID!) { publishPageItem(input:{id:$id}) { pageItem { status } } }',variableValues:['id'=>$created['data']['createPageItem']['pageItem']['id'] ?? self::fail(json_encode($created) ?: '')])->toArray();
        self::assertSame('PUBLISHED',$published['data']['publishPageItem']['pageItem']['status'] ?? null);
        $staff->runtime->create('PageItem',['title'=>'Secret draft','slug'=>'secret-draft','content'=>'Not yet.','kind'=>'Article','page'=>(string)$page->id->raw()]);
        $xml=NewsFeed::render(new App($db,new Actor()),'https://hbla.ke');
        $feed=simplexml_load_string($xml);
        self::assertNotFalse($feed);
        self::assertSame('Fish & <chips>',(string)$feed->entry[0]->title);
        self::assertSame('https://hbla.ke/news/fish-chips',(string)$feed->entry[0]->id);
        self::assertSame('hblake',(string)$feed->entry[0]->author->name);
        self::assertCount(1,$feed->entry);
        self::assertStringNotContainsString('Secret draft',$xml);
    }
}
