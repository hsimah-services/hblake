<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Enum\PublicationStatus;
use Hsimah\Entity\Page\Contract\PageStatusVerifier;
use Hsimah\Entity\PageItem\Contract\PageItemStatusVerifier;
final class StatusVerifier implements PageStatusVerifier, PageItemStatusVerifier {
    public function verify(PublicationStatus $value, MutationContext $context): Verification { return Rules::publication($context); }
}
