<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\GraphQL\Relay\GlobalId;
use Hsimah\Entity\Page\Page;

/**
 * Rules that span an item and its page, applied to the GraphQL create and update inputs
 * before the runtime sees them (PageItem.md): an item belongs to a page that holds items,
 * takes that page's kind unless given one, and records who wrote it.
 */
final class PageItems {
    /**
     * @param array<array-key,mixed> $input
     * @return array<array-key,mixed>
     */
    public static function create(App $app, array $input): array {
        $page=self::page($app,$input['page'] ?? null);
        if (!array_key_exists('kind',$input)) $input['kind']=$page->getDefaultItemKind();
        return $input;
    }

    /**
     * @param array<array-key,mixed> $input
     * @return array<array-key,mixed>
     */
    public static function update(App $app, array $input): array {
        if (array_key_exists('page',$input)) self::page($app,$input['page']);
        return $input;
    }

    /**
     * The signed-in author of new content. It is not a GraphQL input, so clients cannot choose it.
     * @param array<array-key,mixed> $input
     * @return array<array-key,mixed>
     */
    public static function authored(App $app, array $input): array {
        $user=$app->actor->user;
        if ($user!==null && $app->actor->isAuthenticated()) $input['author']=(string)$user->getId();
        return $input;
    }

    private static function page(App $app, mixed $id): Page {
        $entityId=is_string($id) ? GlobalId::entityId($id,'Page') : null;
        $page=$entityId===null ? null : $app->runtime->find('Page',$entityId);
        if (!$page instanceof Page) throw new UserError('Choose an existing page for this item.');
        if ($page->getDefaultItemKind()===null) throw new UserError('This page does not hold items.');
        return $page;
    }
}
