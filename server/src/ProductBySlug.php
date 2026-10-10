<?php
declare(strict_types=1);
namespace Hsimah;

use Hsimah\Entity\Product\Product;
use Hsimah\Entity\Product\Contract\ProductBySlugQuery;
use Eleph\Runtime\Gateway\Runtime;
use Eleph\Runtime\Storage\{Criteria, Filter};
final readonly class ProductBySlug implements ProductBySlugQuery {
    public function __construct(private Runtime $runtime) {}
    public function find(string $slug): ?Product {
        $row=$this->runtime->queries()->of($this->runtime->get('Product'), Criteria::for('Product')->where(Filter::equals('slug', $slug)))->first();
        assert($row===null || $row instanceof Product); return $row;
    }
}
