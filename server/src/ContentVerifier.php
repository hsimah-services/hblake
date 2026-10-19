<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Page\Contract\PageContentVerifier;
use Hsimah\Entity\PageItem\Contract\PageItemContentVerifier;
final class ContentVerifier implements PageContentVerifier, PageItemContentVerifier {
    public function verify(string $value, MutationContext $context): Verification { return Rules::content($value, $context); }
}
