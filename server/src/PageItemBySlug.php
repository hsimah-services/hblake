<?php
declare(strict_types=1);
namespace Hsimah;

use Hsimah\Entity\PageItem\PageItem;
use Hsimah\Entity\PageItem\Contract\PageItemBySlugQuery;
use Eleph\Runtime\Gateway\Runtime;
use Eleph\Runtime\Storage\{Criteria, Filter};
final readonly class PageItemBySlug implements PageItemBySlugQuery {
    public function __construct(private Runtime $runtime) {}
    public function find(string $slug): ?PageItem {
        $row=$this->runtime->queries()->of($this->runtime->get('PageItem'), Criteria::for('PageItem')->where(Filter::equals('slug', $slug)))->first();
        assert($row===null || $row instanceof PageItem); return $row;
    }
}
