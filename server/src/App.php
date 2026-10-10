<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Gateway\{Runtime, UnitOfWorkFactory};
use Eleph\Runtime\Policy\{ReadGate, WriteGate};
use Eleph\Runtime\Query\ValueDecoder;
use Eleph\Runtime\Type\NullProcessorRegistry;
use Eleph\SQLite\{Database, SQLiteAdaptor};
use Eleph\SQLite\Sql\{FieldMap, QueryCompiler};
use Hsimah\Entity\{Catalogue, Wiring};
use Hsimah\Entity\Pattern\Publishable\Contract\{PublishableContentStaffWritePolicy, PublishableContentVisibilityReadPolicy};

final readonly class App {
    public Runtime $runtime;
    public Container $container;
    public Catalogue $catalogue;
    public function __construct(public Database $db, public Actor $actor) {
        $c = new Container(Wiring::registrations());
        $c->set(ValueDecoder::class, new ValueDecoder());
        $c->set(PublishableContentStaffWritePolicy::class, new ContentStaff());
        $c->set(PublishableContentVisibilityReadPolicy::class, new ContentVisibility());
        $catalogue = new Catalogue($c);
        $manifest = require dirname(__DIR__,2).'/generated/sqlite/storage-manifest.php';
        assert($manifest instanceof \Eleph\SQLite\Manifest\StorageManifest);
        /** @var array<string,array<string,string>> $columns */
        $columns=$manifest->columns;
        $storage = new SQLiteAdaptor($db, $manifest->tables, new FieldMap($columns), $manifest->placements, new QueryCompiler(placements: $manifest->placements));
        $runtime = new Runtime($storage, $catalogue, new UnitOfWorkFactory($storage, $catalogue, new NullProcessorRegistry()), new ReadGate($catalogue, $actor), new WriteGate($catalogue, $actor));
        $publish = new Publish();
        foreach (['Page','Post','Product'] as $entity) {
            foreach (['Title','Slug','Content','Status','PublishedAt'] as $field) {
                $interface = "Hsimah\\Entity\\$entity\\Contract\\$entity{$field}Verifier";
                $class = __NAMESPACE__."\\{$field}Verifier";
                $c->set($interface, new $class());
            }
            $c->set("Hsimah\\Entity\\$entity\\Contract\\{$entity}PublishAction", $publish);
            $c->set("Hsimah\\Entity\\$entity\\Contract\\{$entity}UnpublishAction", new Unpublish());
            $class = __NAMESPACE__."\\{$entity}BySlug";
            $c->set("Hsimah\\Entity\\$entity\\Contract\\{$entity}BySlugQuery", new $class($runtime));
        }
        $c->set(\Hsimah\Entity\Product\Contract\ProductEnquiryUrlVerifier::class, new EnquiryUrlVerifier());
        $c->set(\Hsimah\Entity\User\Contract\UserStaffProfileReadPolicy::class, new StaffProfile());
        $c->set(\Hsimah\Entity\User\Contract\UserAdminAccountsWritePolicy::class, new AdminAccounts());
        $c->set(\Hsimah\Entity\User\Contract\UserEmailVerifier::class, new EmailVerifier());
        $c->set(\Hsimah\Entity\User\Contract\UserDisplayNameVerifier::class, new DisplayNameVerifier());
        $this->container=$c; $this->catalogue=$catalogue; $this->runtime=$runtime;
    }
    public static function database(): Database { return new Database(getenv('HSIMAH_DATABASE') ?: dirname(__DIR__,2).'/.var/site.sqlite'); }
}
