<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\SQLite\Database;

/**
 * Reviewed schema upgrades for databases created before a model change. Each runs once,
 * in a transaction, and is recorded in schema_migration; a fresh install records them all
 * as applied because the generated schema already includes their changes.
 */
final class Migrations {
    /** @return array<string, callable(Database): void> */
    private static function all(): array {
        return ['0001-page-placement' => self::pagePlacement(...), '0002-page-items' => self::pageItems(...), '0003-page-item-image' => self::pageItemImage(...)];
    }

    public static function markAllApplied(Database $db): void {
        self::ensureTable($db);
        foreach (array_keys(self::all()) as $id) $db->execute('INSERT OR IGNORE INTO schema_migration(id, applied_at) VALUES (?, ?)', [$id, gmdate('Y-m-d H:i:s')]);
    }

    /** @return list<string> the migrations applied by this run */
    public static function upgrade(Database $db): array {
        self::ensureTable($db);
        $applied=[];
        foreach (self::all() as $id=>$migration) {
            if ($db->scalar('SELECT COUNT(*) FROM schema_migration WHERE id=?',[$id])) continue;
            $db->transaction(function() use($db,$id,$migration): void {
                $migration($db);
                $db->execute('INSERT INTO schema_migration(id, applied_at) VALUES (?, ?)', [$id, gmdate('Y-m-d H:i:s')]);
            });
            $applied[]=$id;
        }
        return $applied;
    }

    private static function ensureTable(Database $db): void {
        $db->pdo->exec('CREATE TABLE IF NOT EXISTS schema_migration (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
    }

    /**
     * Page placement (#13): rebuild hsimah_page from the generated definition, then keep the
     * launch layout, with the four launch pages as coloured home tiles and home off the nav.
     */
    private static function pagePlacement(Database $db): void {
        if (in_array('accent',self::columns($db->pdo,'hsimah_page'),true)) return;
        self::rebuild($db,'hsimah_page',[
            'show_in_navigation'=>"CASE WHEN slug='home' THEN 0 ELSE 1 END",
            'navigation_order'=>"CASE slug WHEN 'about' THEN 1 WHEN 'frameworks' THEN 2 WHEN 'portfolio' THEN 3 WHEN 'contact' THEN 4 ELSE 100 END",
            'feature_on_home'=>"CASE WHEN slug IN ('about','frameworks','portfolio','contact') THEN 1 ELSE 0 END",
            'home_order'=>"CASE slug WHEN 'about' THEN 1 WHEN 'frameworks' THEN 2 WHEN 'portfolio' THEN 3 WHEN 'contact' THEN 4 ELSE 100 END",
            'accent'=>"CASE slug WHEN 'about' THEN 'green' WHEN 'frameworks' THEN 'orange' WHEN 'portfolio' THEN 'blue' WHEN 'contact' THEN 'berry' ELSE 'ink' END",
            'default_item_kind'=>'NULL',
            'author_id'=>'NULL',
        ]);
    }

    /**
     * Page items: Posts and Products become PageItems attached to a Page. Pages gain the kind
     * of item they hold and an author; the old tables are dropped, discarding their rows.
     */
    private static function pageItems(Database $db): void {
        if (!in_array('default_item_kind',self::columns($db->pdo,'hsimah_page'),true)) self::rebuild($db,'hsimah_page',['default_item_kind'=>'NULL','author_id'=>'NULL']);
        if (self::columns($db->pdo,'hsimah_page_item')===[]) foreach (self::generatedDefinition('hsimah_page_item') as $sql) $db->pdo->exec($sql);
        foreach (['hsimah_post','hsimah_product'] as $table) $db->pdo->exec('DROP TABLE IF EXISTS '.$table);
    }

    /** Optional image and alt text on each item. */
    private static function pageItemImage(Database $db): void {
        if (!in_array('image_url',self::columns($db->pdo,'hsimah_page_item'),true)) self::rebuild($db,'hsimah_page_item',['image_url'=>'NULL','image_alt'=>'NULL']);
    }

    /** @return list<string> the generated table statement, then its indexes */
    private static function generatedDefinition(string $table): array {
        $fresh=new \PDO('sqlite::memory:');
        $install=require dirname(__DIR__,2).'/generated/sqlite/install.php';
        assert(is_callable($install)); $install($fresh);
        $ddl=$fresh->query("SELECT sql FROM sqlite_master WHERE tbl_name=".$fresh->quote($table)." AND sql IS NOT NULL ORDER BY type DESC");
        /** @var list<string> $statements */
        $statements=$ddl===false ? [] : $ddl->fetchAll(\PDO::FETCH_COLUMN);
        if ($statements===[]) throw new \RuntimeException('No generated definition for '.$table.'.');
        return $statements;
    }

    /** @return list<string> */
    private static function columns(\PDO $pdo, string $table): array {
        $statement=$pdo->query('PRAGMA table_info('.$table.')');
        $names=[];
        foreach ($statement===false ? [] : $statement->fetchAll(\PDO::FETCH_ASSOC) as $row) if (is_array($row) && is_string($row['name'] ?? null)) $names[]=$row['name'];
        return $names;
    }

    /**
     * Recreates a table exactly as the generated installer defines it, copying shared
     * columns and filling new ones from the given SQL expressions.
     * @param array<string,string> $fill new column => SQL expression over the old row
     */
    private static function rebuild(Database $db, string $table, array $fill): void {
        $fresh=new \PDO('sqlite::memory:');
        $install=require dirname(__DIR__,2).'/generated/sqlite/install.php';
        assert(is_callable($install)); $install($fresh);
        $ddl=$fresh->query("SELECT type, name, sql FROM sqlite_master WHERE tbl_name=".$fresh->quote($table)." AND sql IS NOT NULL ORDER BY type DESC");
        /** @var list<array{type:string,name:string,sql:string}> $objects */
        $objects=$ddl===false ? [] : $ddl->fetchAll(\PDO::FETCH_ASSOC);
        $create=null; $indexes=[];
        foreach ($objects as $object) { if ($object['type']==='table') $create=$object['sql']; else $indexes[]=$object['sql']; }
        if (!is_string($create)) throw new \RuntimeException('No generated definition for '.$table.'.');
        $old=self::columns($db->pdo,$table); $new=self::columns($fresh,$table);
        $values=[];
        foreach ($new as $column) $values[]=in_array($column,$old,true) ? '"'.$column.'"' : ($fill[$column] ?? throw new \RuntimeException('No value for new column '.$column.'.'));
        $names=[];
        foreach ($new as $column) $names[]='"'.$column.'"';
        $db->pdo->exec('PRAGMA foreign_keys=OFF');
        $db->pdo->exec('ALTER TABLE '.$table.' RENAME TO '.$table.'_old');
        $db->pdo->exec($create);
        $db->pdo->exec('INSERT INTO '.$table.' ('.implode(', ',$names).') SELECT '.implode(', ',$values).' FROM '.$table.'_old');
        $db->pdo->exec('DROP TABLE '.$table.'_old');
        foreach ($indexes as $index) $db->pdo->exec($index);
        $db->pdo->exec('PRAGMA foreign_keys=ON');
    }
}
