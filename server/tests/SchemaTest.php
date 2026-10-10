<?php
declare(strict_types=1);
namespace Hsimah\Tests;
use PHPUnit\Framework\TestCase;
use Hsimah\{App, Actor, Schema};
use Eleph\SQLite\Database;
use Eleph\Runtime\Verification\CommitRejected;
use GraphQL\GraphQL;
final class SchemaTest extends TestCase {
    public function testDefaultsAndPublicationAreAppliedThroughGeneratedContracts(): void {
        $app=self::app(); $schema=Schema::build($app);
        $created=GraphQL::executeQuery($schema,'mutation { createPage(input:{title:"Test",slug:"test"}) { page { id status content excerpt } } }')->toArray();
        self::assertArrayNotHasKey('errors',$created);
        $row=$created['data']['createPage']['page'];
        self::assertSame('DRAFT',$row['status']); self::assertSame('',$row['content']);
        $invalid=GraphQL::executeQuery($schema,'mutation($id:ID!) { publishPage(input:{id:$id}) { page { id } } }',variableValues:['id'=>$row['id']])->toArray();
        self::assertArrayHasKey('errors',$invalid);
        $app->runtime->update('Page',\Eleph\Runtime\Identity\EntityId::of(1),['content'=>'Body']);
        $published=GraphQL::executeQuery($schema,'mutation($id:ID!) { publishPage(input:{id:$id}) { page { publishedAt } } }',variableValues:['id'=>$row['id']])->toArray();
        self::assertArrayNotHasKey('errors',$published);
        $time=$published['data']['publishPage']['page']['publishedAt'];
        $repeated=GraphQL::executeQuery($schema,'mutation($id:ID!) { publishPage(input:{id:$id}) { page { publishedAt } } }',variableValues:['id'=>$row['id']])->toArray();
        self::assertSame($time,$repeated['data']['publishPage']['page']['publishedAt']);
    }
    public function testNormalizedEmailCollisionIsRejectedAtomically(): void {
        $app=self::app();
        $input=['email'=>'operator@example.test','displayName'=>'Operator','role'=>'admin','active'=>true];
        $app->runtime->create('User',$input);
        $this->expectException(CommitRejected::class);
        $app->runtime->create('User',[...$input,'email'=>strtolower(trim(' OPERATOR@EXAMPLE.TEST '))]);
    }
    private static function app(): App {
        $db=new Database(':memory:'); $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        return new App($db,new Actor(bootstrap:true));
    }
}
