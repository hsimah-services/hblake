<?php
declare(strict_types=1);
namespace Hsimah\Tests;
use PHPUnit\Framework\TestCase;
use Eleph\SQLite\Database;
use Hsimah\{App, Actor, Schema};
use GraphQL\GraphQL;
final class RecentTest extends TestCase {
    public function testRecentItemsListNewestEditedFirstAndFilterByStatus(): void {
        $db=new Database(':memory:'); $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        $app=new App($db,new Actor(bootstrap:true));
        $app->runtime->create('User',['username'=>'operator','displayName'=>'hblake','role'=>'admin','active'=>true]);
        $schema=Schema::build($app);
        $news=GraphQL::executeQuery($schema,'mutation { createPage(input:{title:"News",slug:"news",content:"News.",defaultItemKind:"Article"}) { page { id } } }')->toArray();
        $page=$news['data']['createPage']['page']['id'] ?? self::fail(json_encode($news) ?: '');
        $ids=[];
        foreach (['old','middle','new'] as $slug) {
            $created=GraphQL::executeQuery($schema,"mutation { createPageItem(input:{title:\"$slug\",slug:\"$slug\",content:\"Body.\",page:\"$page\"}) { pageItem { id } } }")->toArray();
            $ids[$slug]=$created['data']['createPageItem']['pageItem']['id'] ?? self::fail(json_encode($created) ?: '');
        }
        $db->execute("UPDATE hsimah_page_item SET updated_at = CASE slug WHEN 'old' THEN '2026-01-03 00:00:00' WHEN 'middle' THEN '2026-01-01 00:00:00' ELSE '2026-01-02 00:00:00' END");
        GraphQL::executeQuery($schema,'mutation($id:ID!) { publishPageItem(input:{id:$id}) { pageItem { id } } }',variableValues:['id'=>$ids['middle']]);
        $slugs=static function(string $where) use($schema): array {
            $result=GraphQL::executeQuery($schema,"{ recentPageItems($where first:2) { nodes { slug } } }")->toArray();
            return array_column($result['data']['recentPageItems']['nodes'] ?? self::fail(json_encode($result) ?: ''),'slug');
        };
        self::assertSame(['middle','old'],$slugs(''),'publishing counts as an edit');
        self::assertSame(['old','new'],$slugs('where:{status:DRAFT},'));
    }
}
