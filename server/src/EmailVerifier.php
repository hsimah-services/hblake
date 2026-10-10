<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\User\Contract\UserEmailVerifier;
final class EmailVerifier implements UserEmailVerifier {
    public function verify(string $value, MutationContext $context): Verification { return Rules::email($value); }
}
