<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Gateway\Runtime;
use Eleph\Runtime\Query\{EntityQuery, Hydrator};
use Eleph\Runtime\Storage\{Criteria, Filter, Order};
use Hsimah\Entity\Enum\PublicationStatus;
use Hsimah\Entity\Product\Contract\ProductRecentQuery;
use Hsimah\Entity\Product\Product;

/** Products newest-edited first, optionally of one status, for the admin dashboard. */
final readonly class ProductRecent implements ProductRecentQuery {
    public function __construct(private Runtime $runtime) {}
    public function find(?PublicationStatus $status = null): EntityQuery {
        $criteria=Criteria::for('Product');
        if ($status!==null) $criteria=$criteria->where(Filter::equals('status', $status->value));
        /** @var Hydrator<Product> $hydrator */
        $hydrator=$this->runtime->get('Product');
        return $this->runtime->queries()->of($hydrator, $criteria->orderBy(Order::descending('updatedAt'))->orderBy(Order::descending('id')));
    }
}
