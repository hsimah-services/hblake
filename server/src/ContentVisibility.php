<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Policy\{Viewer, PolicyDecision};
use Hsimah\Entity\Pattern\Publishable\Publishable;
use Hsimah\Entity\Pattern\Publishable\Contract\PublishableContentVisibilityReadPolicy;
use Hsimah\Entity\Enum\PublicationStatus;
final class ContentVisibility implements PublishableContentVisibilityReadPolicy {
    public function decide(Publishable $entity, Viewer $viewer): PolicyDecision {
        return $entity->getStatus() === PublicationStatus::Published || $viewer->hasRole('admin') || $viewer->hasRole('editor')
            ? PolicyDecision::allow() : PolicyDecision::deny('Content is unavailable.');
    }
}
