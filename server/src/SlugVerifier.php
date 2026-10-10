<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Page\Contract\PageSlugVerifier;
use Hsimah\Entity\Post\Contract\PostSlugVerifier;
use Hsimah\Entity\Product\Contract\ProductSlugVerifier;
final class SlugVerifier implements PageSlugVerifier, PostSlugVerifier, ProductSlugVerifier {
    public function verify(string $value, MutationContext $context): Verification { return Rules::slug($value); }
}
