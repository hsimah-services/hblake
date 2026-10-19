<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Page\Contract\PageTitleVerifier;
use Hsimah\Entity\PageItem\Contract\PageItemTitleVerifier;
final class TitleVerifier implements PageTitleVerifier, PageItemTitleVerifier {
    public function verify(string $value, MutationContext $context): Verification { return Rules::title($value); }
}
