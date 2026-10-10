<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Enum\PublicationStatus;
use Hsimah\Entity\Page\Contract\PageStatusVerifier;
use Hsimah\Entity\Post\Contract\PostStatusVerifier;
use Hsimah\Entity\Product\Contract\ProductStatusVerifier;
final class StatusVerifier implements PageStatusVerifier, PostStatusVerifier, ProductStatusVerifier {
    public function verify(PublicationStatus $value, MutationContext $context): Verification { return Rules::publication($context); }
}
