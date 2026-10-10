<?php
declare(strict_types=1);
namespace Hsimah;

use Hsimah\Entity\Post\Post;
use Hsimah\Entity\Post\Contract\PostBySlugQuery;
use Eleph\Runtime\Gateway\Runtime;
use Eleph\Runtime\Storage\{Criteria, Filter};
final readonly class PostBySlug implements PostBySlugQuery {
    public function __construct(private Runtime $runtime) {}
    public function find(string $slug): ?Post {
        $row=$this->runtime->queries()->of($this->runtime->get('Post'), Criteria::for('Post')->where(Filter::equals('slug', $slug)))->first();
        assert($row===null || $row instanceof Post); return $row;
    }
}
