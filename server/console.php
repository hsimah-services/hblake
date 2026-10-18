<?php
declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';
use Hsimah\{App, Actor, Auth};
try {
    $db=App::database();
    $command=$argv[1] ?? '';
    switch ($command) {
        case 'install':
            $install=require dirname(__DIR__).'/generated/sqlite/install.php';
            assert(is_callable($install)); $install($db->pdo);
            Auth::install($db); break;
        case 'bootstrap':
            $db->transaction(function() use($db): void {
                if ((int)$db->scalar('SELECT COUNT(*) FROM hsimah_user')!==0) throw new RuntimeException('An account already exists.');
                $username=strtolower(trim(getenv('ADMIN_USERNAME') ?: '')); $password=getenv('ADMIN_PASSWORD') ?: '';
                if (!\Hsimah\Rules::password($password)->isOk()) throw new RuntimeException('Operator password must contain at least 12 characters.');
                $app=new App($db,new Actor(bootstrap:true));
                $result=$app->runtime->create('User',['username'=>$username,'displayName'=>getenv('ADMIN_DISPLAY_NAME') ?: 'Site Operator','role'=>'admin','active'=>true]);
                $db->insert('auth_credential',['user_id'=>(int)$result->id->raw(),'password_hash'=>password_hash($password,PASSWORD_DEFAULT)]);
            }); break;
        case 'replace-content':
            \Hsimah\SiteContent::replace(new App($db,new Actor(bootstrap:true)));
            echo "Site content replaced.\n"; break;
        case 'backup':
            // A tar of a consistent database snapshot (site.sqlite) and the post images (media/).
            $path=$argv[2] ?? ''; if ($path==='' || file_exists($path)) throw new RuntimeException('Choose a new backup path.');
            $work=sys_get_temp_dir().'/hsimah-backup-'.bin2hex(random_bytes(8));
            mkdir($work,0700); $snapshot=$work.'/site.sqlite';
            $db->pdo->exec('VACUUM INTO '.$db->pdo->quote($snapshot));
            $archive=new PharData($work.'/backup.tar');
            $archive->addFile($snapshot,'site.sqlite');
            $media=\Hsimah\Media::directory();
            foreach (is_dir($media) ? (glob($media.'/*') ?: []) : [] as $file) if (is_file($file)) $archive->addFile($file,'media/'.basename($file));
            unset($archive);
            rename($work.'/backup.tar',$path); chmod($path,0600);
            unlink($snapshot); rmdir($work); break;
        case 'expire-sessions': $db->execute('UPDATE auth_session SET expires_at=0'); break;
        case 'set-active':
            if (!in_array($argv[2] ?? '',['true','false'],true)) throw new RuntimeException('Expected true or false.');
            $db->execute('UPDATE hsimah_user SET active=?',[$argv[2]==='true' ? 1 : 0]); break;
        case 'schema':
            echo \GraphQL\Utils\SchemaPrinter::doPrint(\Hsimah\Schema::build(new App($db,new Actor()))); break;
        default: throw new RuntimeException('Unknown operator command.');
    }
} catch (Throwable $error) { fwrite(STDERR,$error->getMessage()."\n"); exit(1); }
