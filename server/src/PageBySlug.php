<?php
declare(strict_types=1);
namespace Hsimah;

use Hsimah\Entity\Page\Page;
use Hsimah\Entity\Page\Contract\PageBySlugQuery;
use Eleph\Runtime\Gateway\Runtime;
use Eleph\Runtime\Storage\{Criteria, Filter};
final readonly class PageBySlug implements PageBySlugQuery {
    public function __construct(private Runtime $runtime) {}
    public function find(string $slug): ?Page {
        $row=$this->runtime->queries()->of($this->runtime->get('Page'), Criteria::for('Page')->where(Filter::equals('slug', $slug)))->first();
        assert($row===null || $row instanceof Page); return $row;
    }
}
