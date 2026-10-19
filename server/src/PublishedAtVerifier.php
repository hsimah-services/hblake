<?php
declare(strict_types=1);
namespace Hsimah;

use DateTimeImmutable;
use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Page\Contract\PagePublishedAtVerifier;
use Hsimah\Entity\PageItem\Contract\PageItemPublishedAtVerifier;
final class PublishedAtVerifier implements PagePublishedAtVerifier, PageItemPublishedAtVerifier {
    public function verify(?DateTimeImmutable $value, MutationContext $context): Verification { return Rules::publication($context); }
}
