<?php
declare(strict_types=1);
namespace Hsimah\Tests;

use Eleph\SQLite\Database;
use Hsimah\{Actor, App, Auth, SiteContent};
use PHPUnit\Framework\TestCase;

final class SiteContentTest extends TestCase {
    public function testReplacementPublishesTheSeedPagesAndPreservesOperator(): void {
        $db=new Database(':memory:');
        $install=require dirname(__DIR__,2).'/generated/sqlite/install.php';
        $install($db->pdo); Auth::install($db);
        $app=new App($db,new Actor(bootstrap:true));
        $user=$app->runtime->create('User',['username'=>'operator','displayName'=>'Operator','role'=>'admin','active'=>true]);
        $db->insert('auth_credential',['user_id'=>(int)$user->id->raw(),'password_hash'=>'preserved']);
        $old=$app->runtime->create('Page',['title'=>'Old','slug'=>'old','defaultItemKind'=>'Article']);
        $app->runtime->create('PageItem',['title'=>'Old item','slug'=>'old-item','kind'=>'Article','page'=>(string)$old->id->raw()]);
        SiteContent::replace($app);
        SiteContent::replace($app);
        self::assertSame(7,(int)$db->scalar('SELECT COUNT(*) FROM hsimah_page WHERE status=?',['published']));
        self::assertSame(0,(int)$db->scalar('SELECT COUNT(*) FROM hsimah_page_item'));
        self::assertSame(['Article','Product'],array_column($db->select("SELECT default_item_kind FROM hsimah_page WHERE slug IN ('news','products') ORDER BY slug"),'default_item_kind'));
        self::assertSame(7,(int)$db->scalar('SELECT COUNT(*) FROM hsimah_page WHERE author_id IS NOT NULL'),'seeded pages are written by the operator');
        self::assertSame('preserved',$db->scalar('SELECT password_hash FROM auth_credential'));
        self::assertSame(1,(int)$db->scalar('SELECT COUNT(*) FROM hsimah_user'));
    }

    public function testRefusedPublicationRollsBackReplacement(): void {
        $db=new Database(':memory:');
        $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        $app=new App($db,new Actor(bootstrap:true));
        $app->runtime->create('Page',['title'=>'Existing','slug'=>'existing']);
        try {
            SiteContent::replace(new App($db,new Actor()));
            self::fail('Anonymous replacement must fail.');
        } catch (\Eleph\Runtime\Policy\AccessDenied $error) {
            self::assertSame('Existing',$db->scalar('SELECT title FROM hsimah_page'));
        }
    }
}
