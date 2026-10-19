<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Policy\{Viewer, PolicyDecision};
use Hsimah\Entity\PageItem\PageItem;
use Hsimah\Entity\Pattern\Publishable\Publishable;
use Hsimah\Entity\Pattern\Publishable\Contract\PublishableContentVisibilityReadPolicy;
use Hsimah\Entity\Enum\PublicationStatus;
final class ContentVisibility implements PublishableContentVisibilityReadPolicy {
    public function decide(Publishable $entity, Viewer $viewer): PolicyDecision {
        $staff=$viewer->hasRole('admin') || $viewer->hasRole('editor');
        // An item is visible to visitors only while its page is published too.
        $visible=$entity->getStatus() === PublicationStatus::Published
            && (!$entity instanceof PageItem || $entity->getPage()?->getStatus() === PublicationStatus::Published);
        return $visible || $staff ? PolicyDecision::allow() : PolicyDecision::deny('Content is unavailable.');
    }
}
