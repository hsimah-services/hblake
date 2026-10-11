<?php
declare(strict_types=1);
namespace Hsimah\Tests;

use Eleph\SQLite\Database;
use Hsimah\{Actor, App, Auth, SiteContent};
use PHPUnit\Framework\TestCase;

final class SiteContentTest extends TestCase {
    public function testReplacementPublishesFivePagesAndPreservesOperator(): void {
        $db=new Database(':memory:');
        $install=require dirname(__DIR__,2).'/generated/sqlite/install.php';
        $install($db->pdo); Auth::install($db);
        $app=new App($db,new Actor(bootstrap:true));
        $user=$app->runtime->create('User',['email'=>'operator@example.test','displayName'=>'Operator','role'=>'admin','active'=>true]);
        $db->insert('auth_credential',['user_id'=>(int)$user->id->raw(),'password_hash'=>'preserved']);
        $app->runtime->create('Post',['title'=>'Old post','slug'=>'old-post']);
        $app->runtime->create('Product',['title'=>'Old product','slug'=>'old-product']);
        SiteContent::replace($app);
        SiteContent::replace($app);
        self::assertSame(5,(int)$db->scalar('SELECT COUNT(*) FROM hsimah_page WHERE status=?',['published']));
        self::assertSame(0,(int)$db->scalar('SELECT COUNT(*) FROM hsimah_post'));
        self::assertSame(0,(int)$db->scalar('SELECT COUNT(*) FROM hsimah_product'));
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
