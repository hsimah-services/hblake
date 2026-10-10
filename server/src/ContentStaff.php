<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Policy\{Viewer, PolicyDecision, WriteContext, WriteOperation};
use Hsimah\Entity\Pattern\Publishable\Publishable;
use Hsimah\Entity\Pattern\Publishable\Contract\PublishableContentStaffWritePolicy;
final class ContentStaff implements PublishableContentStaffWritePolicy {
    public function decide(?Publishable $entity, WriteContext $context, Viewer $viewer): PolicyDecision {
        return $viewer->hasRole('admin') || ($viewer->hasRole('editor') && $context->operation() !== WriteOperation::Delete)
            ? PolicyDecision::allow() : PolicyDecision::deny('Staff permission is required.');
    }
}
