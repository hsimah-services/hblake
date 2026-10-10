<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Page\Contract\PageContentVerifier;
use Hsimah\Entity\Post\Contract\PostContentVerifier;
use Hsimah\Entity\Product\Contract\ProductContentVerifier;
final class ContentVerifier implements PageContentVerifier, PostContentVerifier, ProductContentVerifier {
    public function verify(string $value, MutationContext $context): Verification { return Rules::content($value, $context); }
}
