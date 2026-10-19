<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Gateway\Runtime;
use Eleph\Runtime\Query\{EntityQuery, Hydrator};
use Eleph\Runtime\Storage\{Criteria, EdgeFilter, Filter, Order};
use Hsimah\Entity\Page\Page;
use Hsimah\Entity\PageItem\Contract\PageItemOfPageQuery;
use Hsimah\Entity\PageItem\PageItem;

/** The items of one page, found by its slug, newest published first (PageItem.md). */
final readonly class PageItemOfPage implements PageItemOfPageQuery {
    public function __construct(private Runtime $runtime) {}
    public function find(string $page): EntityQuery {
        $found=$this->runtime->queries()->of($this->runtime->get('Page'), Criteria::for('Page')->where(Filter::equals('slug', $page)))->first();
        $criteria=Criteria::for('PageItem');
        // An unknown or unreadable page lists nothing: a slug is never null, so this matches no row.
        $criteria=$found instanceof Page ? $criteria->linkedTo(EdgeFilter::back('PageItem','page',$found->getId())) : $criteria->where(Filter::isNull('slug'));
        /** @var Hydrator<PageItem> $items */
        $items=$this->runtime->get('PageItem');
        return $this->runtime->queries()->of($items, $criteria->orderBy(Order::descending('publishedAt'))->orderBy(Order::descending('id')));
    }
}
