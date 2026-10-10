<?php
declare(strict_types=1);
namespace Hsimah\Tests;

use Eleph\SQLite\Database;
use Hsimah\Auth;
use PHPUnit\Framework\TestCase;

final class AuthTest extends TestCase {
    public function testAnonymousReadIsLazyAndPurgeKeepsLiveRecords(): void {
        $db=new Database(':memory:');
        $install=require dirname(__DIR__,2).'/generated/sqlite/install.php';
        $install($db->pdo);
        Auth::install($db);
        $now=time();
        foreach (['expired'=>$now-1,'live'=>$now+3600] as $hash=>$expires) {
            $db->insert('auth_session',['token_hash'=>$hash,'user_id'=>null,'csrf'=>'token','expires_at'=>$expires]);
        }
        foreach (['stale'=>$now-901,'recent'=>$now] as $address=>$started) {
            $db->insert('auth_failure',['address'=>$address,'attempts'=>1,'started_at'=>$started]);
        }
        $auth=new Auth($db);
        self::assertFalse($auth->actor()->isAuthenticated());
        self::assertCount(2,$db->select('SELECT * FROM auth_session'));
        $auth->purgeExpired();
        self::assertSame(['live'],array_column($db->select('SELECT * FROM auth_session'),'token_hash'));
        self::assertSame(['recent'],array_column($db->select('SELECT * FROM auth_failure'),'address'));
    }
}
