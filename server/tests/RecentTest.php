<?php
declare(strict_types=1);
namespace Hsimah\Tests;
use PHPUnit\Framework\TestCase;
use Eleph\SQLite\Database;
use Hsimah\{App, Actor, Schema};
use GraphQL\GraphQL;
final class RecentTest extends TestCase {
    public function testRecentListsNewestEditedFirstAndFiltersByStatus(): void {
        $db=new Database(':memory:'); $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        $app=new App($db,new Actor(bootstrap:true));
        $app->runtime->create('User',['username'=>'operator','displayName'=>'hblake','role'=>'admin','active'=>true]);
        $schema=Schema::build($app);
        $ids=[];
        foreach (['old','middle','new'] as $slug) {
            $created=GraphQL::executeQuery($schema,"mutation { createProduct(input:{title:\"$slug\",slug:\"$slug\",content:\"Body.\"}) { product { id } } }")->toArray();
            $ids[$slug]=$created['data']['createProduct']['product']['id'] ?? self::fail(json_encode($created) ?: '');
        }
        $db->execute("UPDATE hsimah_product SET updated_at = CASE slug WHEN 'old' THEN '2026-01-03 00:00:00' WHEN 'middle' THEN '2026-01-01 00:00:00' ELSE '2026-01-02 00:00:00' END");
        GraphQL::executeQuery($schema,'mutation($id:ID!) { publishProduct(input:{id:$id}) { product { id } } }',variableValues:['id'=>$ids['middle']]);
        $slugs=static function(string $where) use($schema): array {
            $result=GraphQL::executeQuery($schema,"{ recentProducts($where first:2) { nodes { slug } } }")->toArray();
            return array_column($result['data']['recentProducts']['nodes'] ?? self::fail(json_encode($result) ?: ''),'slug');
        };
        self::assertSame(['middle','old'],$slugs(''),'publishing counts as an edit');
        self::assertSame(['old','new'],$slugs('where:{status:DRAFT},'));
    }
}
