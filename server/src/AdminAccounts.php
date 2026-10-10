<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Policy\{Viewer, PolicyDecision};
use Hsimah\Entity\User\{User, UserWriteContext};
use Hsimah\Entity\User\Contract\UserAdminAccountsWritePolicy;
final class AdminAccounts implements UserAdminAccountsWritePolicy {
    public function decide(?User $entity, UserWriteContext $context, Viewer $viewer): PolicyDecision {
        return $viewer->hasRole('admin') ? PolicyDecision::allow() : PolicyDecision::deny('Admin permission is required.');
    }
}
