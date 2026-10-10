<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\User\Contract\UserDisplayNameVerifier;
final class DisplayNameVerifier implements UserDisplayNameVerifier {
    public function verify(string $value, MutationContext $context): Verification { return Rules::title($value, 100); }
}
