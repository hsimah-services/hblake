<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Gateway\Runtime;
use Eleph\Runtime\Query\EntityQuery;
use Eleph\Runtime\Storage\{Criteria, Filter, Order};
use Hsimah\Entity\Page\Contract\PagePlacedQuery;
use Hsimah\Entity\Page\Page;
use Eleph\Runtime\Query\Hydrator;

/** Published pages placed on the home page or in the navigation, in placement order (Page.md). */
final readonly class PagePlaced implements PagePlacedQuery {
    public function __construct(private Runtime $runtime) {}
    public function find(bool $home): EntityQuery {
        $criteria=Criteria::for('Page')
            ->where(Filter::equals('status', 'published'))
            ->where(Filter::equals($home ? 'featureOnHome' : 'showInNavigation', true))
            ->orderBy(Order::ascending($home ? 'homeOrder' : 'navigationOrder'))
            ->orderBy(Order::ascending('title'));
        /** @var Hydrator<Page> $pages */
        $pages=$this->runtime->get('Page');
        return $this->runtime->queries()->of($pages, $criteria);
    }
}
