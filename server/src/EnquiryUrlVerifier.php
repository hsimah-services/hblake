<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Product\Contract\ProductEnquiryUrlVerifier;
final class EnquiryUrlVerifier implements ProductEnquiryUrlVerifier {
    public function verify(string $value, MutationContext $context): Verification { return Rules::enquiry($value); }
}
