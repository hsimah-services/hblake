<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Page\Contract\PageDefaultItemKindVerifier;
use Hsimah\Entity\PageItem\Contract\PageItemKindVerifier;
/** The kind label of an item, and the kind a page holds (null: the page holds no items). */
final class KindVerifier implements PageDefaultItemKindVerifier, PageItemKindVerifier {
    public function verify(?string $value, MutationContext $context): Verification { return $value === null ? Verification::ok() : Rules::kind($value); }
}
