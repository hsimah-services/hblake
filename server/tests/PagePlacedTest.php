<?php
declare(strict_types=1);
namespace Hsimah\Tests;
use PHPUnit\Framework\TestCase;
use Eleph\SQLite\Database;
use Hsimah\{App, Actor, Schema};
use GraphQL\GraphQL;
final class PagePlacedTest extends TestCase {
    public function testPlacedPagesArePublishedAndInPlacementOrder(): void {
        $db=new Database(':memory:'); $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        $staff=new App($db,new Actor(bootstrap:true));
        $staff->runtime->create('User',['username'=>'operator','displayName'=>'hblake','role'=>'admin','active'=>true]);
        $schema=Schema::build($staff);
        $pages=[['later',2,true,false],['first',1,true,false],['draft',0,false,true],['nav-b',100,true,true],['nav-a',100,true,true]];
        foreach ($pages as [$slug,$order,$publish,$navigation]) {
            $input=sprintf('{title:"%s",slug:"%s",content:"Body.",featureOnHome:%s,homeOrder:%d,accent:BLUE,showInNavigation:%s}',ucfirst($slug),$slug,str_starts_with($slug,'nav') ? 'false' : 'true',$order,$navigation ? 'true' : 'false');
            $created=GraphQL::executeQuery($schema,"mutation { createPage(input:$input) { page { id } } }")->toArray();
            $id=$created['data']['createPage']['page']['id'] ?? self::fail(json_encode($created) ?: '');
            if ($publish) GraphQL::executeQuery($schema,'mutation($id:ID!) { publishPage(input:{id:$id}) { page { id } } }',variableValues:['id'=>$id]);
        }
        $public=Schema::build(new App($db,new Actor()));
        $slugs=static function(bool $home) use($public): array {
            $result=GraphQL::executeQuery($public,'query($home:Boolean!) { placedPages(where:{home:$home}, first:100) { nodes { slug } } }',variableValues:['home'=>$home])->toArray();
            return array_column($result['data']['placedPages']['nodes'] ?? self::fail(json_encode($result) ?: ''),'slug');
        };
        self::assertSame(['first','later'],$slugs(true));
        self::assertSame(['nav-a','nav-b'],$slugs(false));
    }
}
