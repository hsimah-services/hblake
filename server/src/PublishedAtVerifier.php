<?php
declare(strict_types=1);
namespace Hsimah;

use DateTimeImmutable;
use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Page\Contract\PagePublishedAtVerifier;
use Hsimah\Entity\Post\Contract\PostPublishedAtVerifier;
use Hsimah\Entity\Product\Contract\ProductPublishedAtVerifier;
final class PublishedAtVerifier implements PagePublishedAtVerifier, PostPublishedAtVerifier, ProductPublishedAtVerifier {
    public function verify(?DateTimeImmutable $value, MutationContext $context): Verification { return Rules::publication($context); }
}
