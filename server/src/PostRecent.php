<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Gateway\Runtime;
use Eleph\Runtime\Query\{EntityQuery, Hydrator};
use Eleph\Runtime\Storage\{Criteria, Filter, Order};
use Hsimah\Entity\Enum\PublicationStatus;
use Hsimah\Entity\Post\Contract\PostRecentQuery;
use Hsimah\Entity\Post\Post;

/** Posts newest-edited first, optionally of one status, for the admin dashboard. */
final readonly class PostRecent implements PostRecentQuery {
    public function __construct(private Runtime $runtime) {}
    public function find(?PublicationStatus $status = null): EntityQuery {
        $criteria=Criteria::for('Post');
        if ($status!==null) $criteria=$criteria->where(Filter::equals('status', $status->value));
        /** @var Hydrator<Post> $hydrator */
        $hydrator=$this->runtime->get('Post');
        return $this->runtime->queries()->of($hydrator, $criteria->orderBy(Order::descending('updatedAt'))->orderBy(Order::descending('id')));
    }
}
