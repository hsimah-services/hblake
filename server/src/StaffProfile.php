<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Policy\{Viewer, PolicyDecision};
use Hsimah\Entity\User\User;
use Hsimah\Entity\User\Contract\UserStaffProfileReadPolicy;
final class StaffProfile implements UserStaffProfileReadPolicy {
    public function decide(User $entity, Viewer $viewer): PolicyDecision {
        return $viewer->hasRole('admin') || ($viewer->isAuthenticated() && (string)$entity->getId() === $viewer->id())
            ? PolicyDecision::allow() : PolicyDecision::deny('Profile is unavailable.');
    }
}
