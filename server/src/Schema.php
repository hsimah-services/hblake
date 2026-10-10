<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\GraphQL\SchemaBuilder;
use Eleph\GraphQL\Registration\{TypeRegistrar, MutationRegistrar};
use Eleph\GraphQL\Relay\GlobalId;
use Eleph\GraphQL\Resolver\Connections;
use Eleph\Runtime\Storage\{Criteria, Order};
use Eleph\Runtime\Identity\EntityId;
use Hsimah\Entity\User\User;
use GraphQL\Type\Schema as GraphQLSchema;
use RuntimeException;

final class Schema {
    public static function build(App $app): GraphQLSchema {
        $manifest = require dirname(__DIR__,2).'/generated/graphql/graphql-manifest.php';
        assert($manifest instanceof \Eleph\GraphQL\Manifest\Manifest);
        $b=new SchemaBuilder(); $r=new TypeRegistrar($manifest,$app->runtime);
        $b->interface('Node',['id'=>['type'=>['non_null'=>'ID']]], static fn(object $row) => $b->type((new \ReflectionClass($row))->getShortName()));
        $b->object('PageInfo',['fields'=>[
            'hasNextPage'=>['type'=>['non_null'=>'Boolean']], 'hasPreviousPage'=>['type'=>['non_null'=>'Boolean']],
            'startCursor'=>['type'=>'String'], 'endCursor'=>['type'=>'String']]]);
        foreach($r->enumConfigs() as $name=>$config) $b->enum($name,$config);
        $b->enum('UserRole',['values'=>['EDITOR'=>['value'=>'editor'],'ADMIN'=>['value'=>'admin']]]);
        foreach($r->objectConfigs() as $name=>$config) { assert(is_array($config['fields'])); unset($config['fields']['databaseId']); $b->object($name,$config); }
        foreach($r->rootFieldConfigs() as $field) {
            foreach(['Page','Post','Product'] as $entity) {
                if ($field['name'] === lcfirst($entity).'BySlug') {
                    // shortcut: runtime runQuery assumes collections; delegate this generated scalar finder directly.
                    $field['field']['resolve']=static function($source,array $args) use($app,$entity) { $finder=$app->catalogue->finder($entity); assert($finder instanceof \Hsimah\Entity\Page\PageFinder || $finder instanceof \Hsimah\Entity\Post\PostFinder || $finder instanceof \Hsimah\Entity\Product\ProductFinder); assert(is_string($args['slug'])); return $finder->bySlug($args['slug']); };
                }
            }
            $b->field('RootQuery',$field['name'],$field['field']);
        }
        foreach($r->connectionConfigs() as $config) {
            $entity=$config['toType']; assert(is_string($entity));
            $config['resolve']=static function($source,array $args) use($app,$entity): array {
                $criteria=Criteria::for($entity);
                $criteria=$entity === 'Product'
                    ? $criteria->orderBy(Order::ascending('title'))->orderBy(Order::ascending('id'))
                    : ($entity === 'Post' ? $criteria->orderBy(Order::descending('publishedAt'))->orderBy(Order::descending('id')) : $criteria->orderBy(Order::ascending('id')));
                return (new Connections())->resolve($app->runtime->queries()->of($app->catalogue->hydrator($entity),$criteria),['first'=>20,...$args]);
            };
            $b->connection($config);
        }
        foreach((new MutationRegistrar($manifest,$app->runtime))->configs() as $name=>$config) {
            if (str_starts_with($name,'create')) {
                $resolve=$config['mutateAndGetPayload']; assert(is_callable($resolve));
                $config['mutateAndGetPayload']=static function(array $input) use($resolve): array { $result=$resolve(['content'=>'','excerpt'=>'','status'=>'draft','publishedAt'=>null,...$input]); assert(is_array($result)); return $result; };
            }
            if (str_starts_with($name,'update')) {
                $entity=substr($name,6); $resolve=$config['mutateAndGetPayload']; assert(is_callable($resolve));
                $config['mutateAndGetPayload']=static function(array $input) use($app,$entity,$resolve): array {
                    $id=GlobalId::entityId($input['id'] ?? null,$entity) ?? throw new RuntimeException('Invalid content id.');
                    $row=$app->runtime->find($entity,$id);
                    if (!$row instanceof \Hsimah\Entity\Pattern\Publishable\Publishable) throw new RuntimeException('Content is unavailable.');
                    // Nullable values bypass field verifiers in the current runtime, so validate clearing here too.
                    if (array_key_exists('publishedAt',$input)) {
                        $time=$input['publishedAt'];
                        if ($time!==null && !is_string($time)) throw new RuntimeException('Invalid publication time.');
                        $time=$time===null ? null : new \DateTimeImmutable($time);
                        if ($time != $row->getPublishedAt()) throw new RuntimeException('Publication time is server-owned.');
                    }
                    $result=$resolve($input); assert(is_array($result)); return $result;
                };
            }
            if (str_starts_with($name,'publish')) {
                $entity=substr($name,7); $resolve=$config['mutateAndGetPayload']; assert(is_callable($resolve));
                $config['mutateAndGetPayload']=static function(array $input) use($app,$entity,$resolve): array {
                    $id=GlobalId::entityId($input['id'] ?? null,$entity) ?? throw new RuntimeException('Invalid content id.');
                    $row=$app->runtime->find($entity,$id);
                    if (!$row instanceof \Hsimah\Entity\Pattern\Publishable\Publishable) throw new RuntimeException('Content is unavailable.');
                    $app->publish->originalTime=$row->getPublishedAt();
                    try { $result=$resolve($input); assert(is_array($result)); return $result; } finally { $app->publish->originalTime=null; }
                };
            }
            $b->mutation($name,$config);
        }
        $b->field('RootQuery','node',['type'=>'Node','args'=>['id'=>['type'=>['non_null'=>'ID']]],'resolve'=>static function($source,array $args) use($app): ?object {
            assert(is_string($args['id'])); $global=GlobalId::decode($args['id']);
            if ($global===null || !in_array($global->type,['Page','Post','Product'],true)) return null;
            return $app->runtime->find($global->type,EntityId::of($global->id));
        }]);
        $b->object('Viewer',['fields'=>['id'=>['type'=>'ID'],'displayName'=>['type'=>'String'],'role'=>['type'=>'UserRole']]]);
        $b->field('RootQuery','viewer',['type'=>'Viewer','resolve'=>static fn()=>self::viewer($app->actor)]);
        $b->object('AdminUser',['fields'=>[
            'id'=>['type'=>['non_null'=>'ID']], 'email'=>['type'=>'String'],'displayName'=>['type'=>'String'],
            'role'=>['type'=>'UserRole'],'active'=>['type'=>'Boolean'],'createdAt'=>['type'=>'String'],'updatedAt'=>['type'=>'String']]]);
        $b->field('RootQuery','adminUser',['type'=>'AdminUser','args'=>['id'=>['type'=>['non_null'=>'ID']]],'resolve'=>static function($source,array $args) use($app): ?array {
            self::requireAdmin($app);
            $id=GlobalId::entityId($args['id'],'User');
            $user=$id===null ? null : $app->runtime->find('User',$id);
            return $user instanceof User ? self::profile($user) : null;
        }]);
        $b->mutation('updateAdminUser',[
            'inputFields'=>['id'=>['type'=>['non_null'=>'ID']],'email'=>['type'=>'String'],'displayName'=>['type'=>'String']],
            'outputFields'=>['adminUser'=>['type'=>'AdminUser']],
            'mutateAndGetPayload'=>static function(array $input) use($app): array {
                self::requireAdmin($app);
                $id=GlobalId::entityId($input['id'],'User') ?? throw new RuntimeException('Invalid profile id.');
                unset($input['id']);
                if (isset($input['email']) && is_string($input['email'])) $input['email']=strtolower(trim($input['email']));
                $result=$app->runtime->update('User',$id,Http::object($input));
                return ['adminUser'=>$result->entity instanceof User ? self::profile($result->entity) : null];
            }]);
        $schema=$b->build(); $schema->assertValid(); return $schema;
    }
    private static function requireAdmin(App $app): void { if (!$app->actor->hasRole('admin')) throw new RuntimeException('Admin permission is required.'); }
    /** @return array{id:string,displayName:string,role:string}|null */
    public static function viewer(Actor $actor): ?array {
        return $actor->user===null || !$actor->isAuthenticated() ? null : ['id'=>GlobalId::encode('User',(string)$actor->user->getId()),'displayName'=>$actor->user->getDisplayName(),'role'=>$actor->user->getRole()->value];
    }
    /** @return array<string,mixed> */
    private static function profile(User $user): array {
        return ['id'=>GlobalId::encode('User',(string)$user->getId()),'email'=>$user->getEmail(),'displayName'=>$user->getDisplayName(),'role'=>$user->getRole()->value,'active'=>$user->getActive(),'createdAt'=>$user->getCreatedAt()->format(DATE_ATOM),'updatedAt'=>$user->getUpdatedAt()->format(DATE_ATOM)];
    }
}
