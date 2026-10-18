<?php
declare(strict_types=1);
namespace Hsimah\Tests;
use PHPUnit\Framework\TestCase;
use Eleph\SQLite\Database;
use Hsimah\{App, Actor, NewsFeed, Schema};
use GraphQL\GraphQL;
final class NewsFeedTest extends TestCase {
    public function testFeedListsOnlyPublishedPostsWithEscapedText(): void {
        $db=new Database(':memory:'); $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        $staff=new App($db,new Actor(bootstrap:true));
        $staff->runtime->create('User',['username'=>'operator','displayName'=>'hblake','role'=>'admin','active'=>true]);
        $schema=Schema::build($staff);
        $created=GraphQL::executeQuery($schema,'mutation { createPost(input:{title:"Fish & <chips>",slug:"fish-chips",content:"Body.",excerpt:"A summary."}) { post { id } } }')->toArray();
        $published=GraphQL::executeQuery($schema,'mutation($id:ID!) { publishPost(input:{id:$id}) { post { status } } }',variableValues:['id'=>$created['data']['createPost']['post']['id']])->toArray();
        self::assertSame('PUBLISHED',$published['data']['publishPost']['post']['status'] ?? null);
        $staff->runtime->create('Post',['title'=>'Secret draft','slug'=>'secret-draft','content'=>'Not yet.']);
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
