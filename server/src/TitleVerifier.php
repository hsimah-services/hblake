<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Page\Contract\PageTitleVerifier;
use Hsimah\Entity\Post\Contract\PostTitleVerifier;
use Hsimah\Entity\Product\Contract\ProductTitleVerifier;
final class TitleVerifier implements PageTitleVerifier, PostTitleVerifier, ProductTitleVerifier {
    public function verify(string $value, MutationContext $context): Verification { return Rules::title($value); }
}
