<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Gateway\Runtime;
use Eleph\Runtime\Query\{EntityQuery, Hydrator};
use Eleph\Runtime\Storage\{Criteria, Filter, Order};
use Hsimah\Entity\Enum\PublicationStatus;
use Hsimah\Entity\PageItem\Contract\PageItemRecentQuery;
use Hsimah\Entity\PageItem\PageItem;

/** Items newest-edited first, optionally of one kind or status, for the admin dashboard. */
final readonly class PageItemRecent implements PageItemRecentQuery {
    public function __construct(private Runtime $runtime) {}
    public function find(?string $kind = null, ?PublicationStatus $status = null): EntityQuery {
        $criteria=Criteria::for('PageItem');
        if ($kind!==null) $criteria=$criteria->where(Filter::equals('kind', $kind));
        if ($status!==null) $criteria=$criteria->where(Filter::equals('status', $status->value));
        /** @var Hydrator<PageItem> $hydrator */
        $hydrator=$this->runtime->get('PageItem');
        return $this->runtime->queries()->of($hydrator, $criteria->orderBy(Order::descending('updatedAt'))->orderBy(Order::descending('id')));
    }
}
