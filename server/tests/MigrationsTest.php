<?php
declare(strict_types=1);
namespace Hsimah\Tests;
use PHPUnit\Framework\TestCase;
use Eleph\SQLite\Database;
use Hsimah\Migrations;
final class MigrationsTest extends TestCase {
    /** hsimah_page as installed before page placement (#13). */
    private const PAGE_BEFORE_PLACEMENT = <<<'SQL'
        CREATE TABLE "hsimah_page" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "title" TEXT NOT NULL CHECK (length("title") <= 200),
            "slug" TEXT NOT NULL CHECK (length("slug") <= 160),
            "content" TEXT NOT NULL,
            "excerpt" TEXT NOT NULL CHECK (length("excerpt") <= 300),
            "status" TEXT NOT NULL CHECK ("status" IN ('draft', 'published')),
            "published_at" TEXT,
            "created_at" TEXT NOT NULL,
            "updated_at" TEXT NOT NULL
        );
        CREATE UNIQUE INDEX "hsimah_page_slug_uniq" ON "hsimah_page" ("slug");
        CREATE INDEX "hsimah_page_status_idx" ON "hsimah_page" ("status");
        SQL;

    public function testPagePlacementUpgradesAnOldDatabaseToTheGeneratedSchema(): void {
        $db=new Database(':memory:');
        $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        $expected=self::shape($db);
        $db->pdo->exec('DROP TABLE hsimah_page');
        $db->pdo->exec(self::PAGE_BEFORE_PLACEMENT);
        foreach (['home','about','frameworks','portfolio','contact','extra'] as $slug) {
            $db->execute("INSERT INTO hsimah_page (title, slug, content, excerpt, status, published_at, created_at, updated_at) VALUES (?, ?, 'Body', '', 'published', '2026-10-01 00:00:00', '2026-10-01 00:00:00', '2026-10-01 00:00:00')", [ucfirst($slug), $slug]);
        }

        self::assertSame(['0001-page-placement','0002-page-items','0003-page-item-image'], Migrations::upgrade($db));
        self::assertSame($expected, self::shape($db), 'the upgraded table matches a fresh install');
        $rows=$db->select('SELECT slug, title, show_in_navigation, navigation_order, feature_on_home, home_order, accent FROM hsimah_page ORDER BY id');
        self::assertSame(['slug'=>'home','title'=>'Home','show_in_navigation'=>0,'navigation_order'=>100,'feature_on_home'=>0,'home_order'=>100,'accent'=>'ink'], $rows[0]);
        self::assertSame(['slug'=>'about','title'=>'About','show_in_navigation'=>1,'navigation_order'=>1,'feature_on_home'=>1,'home_order'=>1,'accent'=>'green'], $rows[1]);
        self::assertSame('berry', $rows[4]['accent']);
        self::assertSame(['slug'=>'extra','title'=>'Extra','show_in_navigation'=>1,'navigation_order'=>100,'feature_on_home'=>0,'home_order'=>100,'accent'=>'ink'], $rows[5]);
        self::assertSame([], Migrations::upgrade($db), 'a second run changes nothing');
    }

    public function testPageItemsReplaceThePostAndProductTables(): void {
        $db=new Database(':memory:');
        $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        Migrations::markAllApplied($db);
        $db->pdo->exec('DROP TABLE hsimah_page_item');
        foreach (['hsimah_post','hsimah_product'] as $table) $db->pdo->exec('CREATE TABLE '.$table.' (id INTEGER PRIMARY KEY, title TEXT)');
        $db->execute("DELETE FROM schema_migration WHERE id='0002-page-items'");

        self::assertSame(['0002-page-items'], Migrations::upgrade($db));
        self::assertSame(0,(int)$db->scalar('SELECT COUNT(*) FROM hsimah_page_item'), 'the items table exists and is empty');
        self::assertSame(0,(int)$db->scalar("SELECT COUNT(*) FROM sqlite_master WHERE name IN ('hsimah_post','hsimah_product')"), 'the old tables are gone');
        self::assertSame([], Migrations::upgrade($db));
    }

    public function testItemsGainImageColumns(): void {
        $db=new Database(':memory:');
        $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        Migrations::markAllApplied($db);
        $db->pdo->exec('DROP TABLE hsimah_page_item');
        $db->pdo->exec('CREATE TABLE hsimah_page_item (id INTEGER PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL, content TEXT NOT NULL, excerpt TEXT NOT NULL, status TEXT NOT NULL, published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, kind TEXT NOT NULL, enquiry_url TEXT, author_id INTEGER, page_id INTEGER)');
        $db->execute("DELETE FROM schema_migration WHERE id='0003-page-item-image'");
        self::assertSame(['0003-page-item-image'], Migrations::upgrade($db));
        self::assertContains('image_url', array_column($db->select('PRAGMA table_info(hsimah_page_item)'), 'name'));
    }

    public function testAFreshInstallNeedsNoUpgrade(): void {
        $db=new Database(':memory:');
        $install=require dirname(__DIR__,2).'/generated/sqlite/install.php'; $install($db->pdo);
        Migrations::markAllApplied($db);
        self::assertSame([], Migrations::upgrade($db));
    }

    /** @return array<string,mixed> table columns and index definitions for hsimah_page */
    private static function shape(Database $db): array {
        return [
            'columns'=>$db->select('PRAGMA table_info(hsimah_page)'),
            'indexes'=>$db->select("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='hsimah_page' AND sql IS NOT NULL ORDER BY name"),
        ];
    }
}
