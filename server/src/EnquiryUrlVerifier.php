<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\PageItem\Contract\PageItemEnquiryUrlVerifier;
final class EnquiryUrlVerifier implements PageItemEnquiryUrlVerifier {
    public function verify(?string $value, MutationContext $context): Verification { return $value === null ? Verification::ok() : Rules::enquiry($value); }
}
