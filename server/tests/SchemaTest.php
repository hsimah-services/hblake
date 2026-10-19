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
    public function testDuplicateUsernameIsRejectedAtomically(): void {
        $app=self::app();
        $input=['username'=>'operator','displayName'=>'Operator','role'=>'admin','active'=>true];
        $app->runtime->create('User',$input);
        $this->expectException(CommitRejected::class);
        $app->runtime->create('User',$input);
    }
    public function testAuthorIsTheSignedInAccountDisplayNameOnly(): void {
        $app=self::app();
        $user=$app->runtime->create('User',['username'=>'adminhabl','displayName'=>'hblake','role'=>'admin','active'=>true]);
        $account=$app->runtime->find('User',$user->id);
        self::assertInstanceOf(\Hsimah\Entity\User\User::class,$account);
        $signedIn=new App($app->db,new Actor($account));
        $schema=Schema::build($signedIn);
        $page=GraphQL::executeQuery($schema,'mutation { createPage(input:{title:"News",slug:"news",content:"News.",defaultItemKind:"Article"}) { page { id author { displayName } } } }')->toArray();
        self::assertSame(['displayName'=>'hblake'],$page['data']['createPage']['page']['author'] ?? null,json_encode($page) ?: '');
        $item=GraphQL::executeQuery($schema,'mutation($page:ID!) { createPageItem(input:{title:"Hello",slug:"hello",page:$page}) { pageItem { kind author { displayName } } } }',variableValues:['page'=>$page['data']['createPage']['page']['id']])->toArray();
        self::assertSame(['kind'=>'Article','author'=>['displayName'=>'hblake']],$item['data']['createPageItem']['pageItem'] ?? null,json_encode($item) ?: '');
        $noClientAuthor=GraphQL::executeQuery($schema,'mutation { createPage(input:{title:"X",slug:"x",author:"1"}) { page { id } } }')->toArray();
        self::assertArrayHasKey('errors',$noClientAuthor,'the author is not an input');
    }
    public function testAnItemNeedsAPageThatHoldsItems(): void {
        $app=self::app(); $schema=Schema::build($app);
        $plain=GraphQL::executeQuery($schema,'mutation { createPage(input:{title:"Plain",slug:"plain"}) { page { id } } }')->toArray();
        $id=$plain['data']['createPage']['page']['id'];
        foreach ([[],['page'=>$id],['page'=>'nope']] as $extra) {
            $result=GraphQL::executeQuery($schema,'mutation($page:ID) { createPageItem(input:{title:"T",slug:"t",page:$page}) { pageItem { id } } }',variableValues:['page'=>$extra['page'] ?? null])->toArray();
            self::assertArrayHasKey('errors',$result);
        }
        self::assertSame(0,(int)$app->db->scalar('SELECT COUNT(*) FROM hsimah_page_item'));
    }
    public function testReservedSlugsCannotNameAPage(): void {
        $schema=Schema::build(self::app());
        foreach (\Hsimah\Rules::RESERVED_SLUGS as $slug) {
            $result=GraphQL::executeQuery($schema,'mutation { createPage(input:{title:"T",slug:"'.$slug.'"}) { page { id } } }')->toArray();
            self::assertArrayHasKey('errors',$result,$slug);
        }
    }
    private static function app(): App {
        $db=new Database(':memory:'); $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        return new App($db,new Actor(bootstrap:true));
    }
}
