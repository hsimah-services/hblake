<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Page\Contract\PageSlugVerifier;
use Hsimah\Entity\PageItem\Contract\PageItemSlugVerifier;
/** Page slugs may not shadow a fixed route, because items live at /<page-slug>/<item-slug>. */
final class SlugVerifier implements PageSlugVerifier, PageItemSlugVerifier {
    public function __construct(private readonly bool $page = false) {}
    public function verify(string $value, MutationContext $context): Verification {
        $slug=Rules::slug($value);
        return $this->page && $slug->isOk() ? Rules::pageSlug($value) : $slug;
    }
}
