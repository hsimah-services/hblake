<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\GraphQL\SchemaBuilder;
use Eleph\GraphQL\Registration\{TypeRegistrar, MutationRegistrar};
use Eleph\GraphQL\Relay\GlobalId;
use Eleph\GraphQL\Resolver\Connections;
use Eleph\Runtime\Storage\{Criteria, EdgeFilter, Filter, Order};
use Eleph\Runtime\Identity\EntityId;
use Hsimah\Entity\Page\Page;
use Hsimah\Entity\PageItem\PageItem;
use Hsimah\Entity\User\User;
use GraphQL\Type\Schema as GraphQLSchema;

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
        // Pages and items have one author. Only the display name is public.
        $b->object('Author',['fields'=>['displayName'=>['type'=>['non_null'=>'String']]]]);
        foreach($r->objectConfigs() as $name=>$config) {
            assert(is_array($config['fields'])); unset($config['fields']['databaseId']);
            if ($name==='Page') {
                $config['fields']['itemCount']=['type'=>['non_null'=>'Int'],'resolve'=>static fn(Page $page): int => self::items($app,$page,false)];
                $config['fields']['publishedItemCount']=['type'=>['non_null'=>'Int'],'resolve'=>static fn(Page $page): int => self::items($app,$page,true)];
            }
            if ($name==='Page' || $name==='PageItem') $config['fields']['author']=['type'=>'Author','resolve'=>static fn(object $row): ?array => self::author($app,$row)];
            $b->object($name,$config);
        }
        foreach($r->rootFieldConfigs() as $field) {
            $b->field('RootQuery',$field['name'],$field['field']);
        }
        foreach($r->connectionConfigs() as $config) {
            $entity=$config['toType']; assert(is_string($entity));
            if (isset($config['connectionArgs'])) {
                // A spec query: its handler orders and filters. Its arguments arrive inside
                // `where` as raw GraphQL values, but the resolver reads them beside the paging
                // arguments and the handler takes enum arguments as PHP enums.
                $resolve=$config['resolve']; assert(is_callable($resolve));
                $declared=is_array($config['connectionArgs']) ? $config['connectionArgs'] : [];
                $config['resolve']=static function($source,array $args) use($resolve,$declared): mixed {
                    $where=is_array($args['where'] ?? null) ? $args['where'] : [];
                    foreach ($where as $name=>$value) {
                        $arg=$declared[$name] ?? null;
                        $type=is_array($arg) ? ($arg['type'] ?? null) : null;
                        $type=is_array($type) ? ($type['non_null'] ?? null) : $type;
                        $enum='Hsimah\\Entity\\Enum\\'.(is_string($type) ? $type : '');
                        if (is_string($value) && is_subclass_of($enum,\BackedEnum::class)) $where[$name]=$enum::from($value);
                    }
                    return $resolve($source,['first'=>20,...$where,...$args]);
                };
                $b->connection($config);
                continue;
            }
            $config['resolve']=static function($source,array $args) use($app,$entity): array {
                $criteria=Criteria::for($entity);
                $criteria=$entity === 'PageItem'
                    ? $criteria->orderBy(Order::descending('publishedAt'))->orderBy(Order::descending('id'))
                    : $criteria->orderBy(Order::ascending('id'));
                return (new Connections())->resolve($app->runtime->queries()->of($app->catalogue->hydrator($entity),$criteria),['first'=>20,...$args]);
            };
            $b->connection($config);
        }
        foreach((new MutationRegistrar($manifest,$app->runtime))->configs() as $name=>$config) {
            // Content records who wrote it, and an item needs a page that holds items.
            $prepare=match($name) {
                'createPage' => static fn(array $input): array => PageItems::authored($app,$input),
                'createPageItem' => static fn(array $input): array => PageItems::authored($app,PageItems::create($app,$input)),
                'updatePageItem' => static fn(array $input): array => PageItems::update($app,$input),
                default => null,
            };
            if ($prepare!==null) {
                $mutate=$config['mutateAndGetPayload']; assert(is_callable($mutate));
                $config['mutateAndGetPayload']=static fn(array $input): mixed => $mutate($prepare($input));
            }
            $b->mutation($name,$config);
        }
        $b->field('RootQuery','node',['type'=>'Node','args'=>['id'=>['type'=>['non_null'=>'ID']]],'resolve'=>static function($source,array $args) use($app): ?object {
            assert(is_string($args['id'])); $global=GlobalId::decode($args['id']);
            if ($global===null || !in_array($global->type,['Page','PageItem'],true)) return null;
            return $app->runtime->find($global->type,EntityId::of($global->id));
        }]);
        $b->object('Viewer',['fields'=>['id'=>['type'=>'ID'],'displayName'=>['type'=>'String'],'role'=>['type'=>'UserRole']]]);
        $b->field('RootQuery','viewer',['type'=>'Viewer','resolve'=>static fn()=>self::viewer($app->actor)]);
        $b->object('AdminUser',['fields'=>[
            'id'=>['type'=>['non_null'=>'ID']],'username'=>['type'=>'String'],'displayName'=>['type'=>'String']]]);
        $b->field('RootQuery','adminUser',['type'=>'AdminUser','args'=>['id'=>['type'=>['non_null'=>'ID']]],'resolve'=>static function($source,array $args) use($app): ?array {
            self::requireAdmin($app);
            $id=GlobalId::entityId($args['id'],'User');
            $user=$id===null ? null : $app->runtime->find('User',$id);
            return $user instanceof User ? self::profile($user) : null;
        }]);
        $b->mutation('updateAdminUser',[
            'inputFields'=>['id'=>['type'=>['non_null'=>'ID']],'displayName'=>['type'=>'String']],
            'outputFields'=>['adminUser'=>['type'=>'AdminUser']],
            'mutateAndGetPayload'=>static function(array $input) use($app): array {
                self::requireAdmin($app);
                $id=GlobalId::entityId($input['id'],'User') ?? throw new UserError('Invalid profile id.');
                unset($input['id']);
                if (array_key_exists('displayName',$input) && $input['displayName']===null) throw new UserError('Profile fields cannot be null.');
                $result=$app->runtime->update('User',$id,Http::object($input));
                return ['adminUser'=>$result->entity instanceof User ? self::profile($result->entity) : null];
            }]);
        $schema=$b->build(); $schema->assertValid(); return $schema;
    }
    private static function requireAdmin(App $app): void { if (!$app->actor->hasRole('admin')) throw new UserError('Admin permission is required.'); }
    /** @return array{id:string,displayName:string,role:string}|null */
    public static function viewer(Actor $actor): ?array {
        return $actor->user===null || !$actor->isAuthenticated() ? null : ['id'=>GlobalId::encode('User',(string)$actor->user->getId()),'displayName'=>$actor->user->getDisplayName(),'role'=>$actor->user->getRole()->value];
    }
    /** @return array{id:string,username:string,displayName:string} */
    private static function profile(User $user): array {
        return ['id'=>GlobalId::encode('User',(string)$user->getId()),'username'=>$user->getUsername(),'displayName'=>$user->getDisplayName()];
    }
    /** The items of a page the viewer can read, optionally only the published ones. */
    private static function items(App $app, Page $page, bool $published): int {
        $criteria=Criteria::for('PageItem')->linkedTo(EdgeFilter::back('PageItem','page',$page->getId()));
        if ($published) $criteria=$criteria->where(Filter::equals('status','published'));
        return $app->runtime->queries()->of($app->catalogue->hydrator('PageItem'),$criteria)->count();
    }
    /**
     * Read from trusted storage: visitors cannot read User, and the projection is the display name only.
     * @return array{displayName:string}|null
     */
    private static function author(App $app, object $row): ?array {
        $table=match(true) { $row instanceof Page => 'hsimah_page', $row instanceof PageItem => 'hsimah_page_item', default => null };
        if ($table===null) return null;
        $name=$app->db->scalar('SELECT u.display_name FROM '.$table.' c JOIN hsimah_user u ON u.id=c.author_id WHERE c.id=?',[$row->getId()->raw()]);
        return is_string($name) ? ['displayName'=>$name] : null;
    }
}
