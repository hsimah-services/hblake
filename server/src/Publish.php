<?php
declare(strict_types=1);
namespace Hsimah;

use DateTimeImmutable;
use DateTimeZone;
use Hsimah\Entity\Enum\PublicationStatus;
use Hsimah\Entity\Page\PagePublishContext;
use Hsimah\Entity\PageItem\PageItemPublishContext;
use Hsimah\Entity\Page\Contract\PagePublishAction;
use Hsimah\Entity\PageItem\Contract\PageItemPublishAction;
final class Publish implements PagePublishAction, PageItemPublishAction {
    public function handle(PagePublishContext|PageItemPublishContext $context): void {
        $context->setStatus(PublicationStatus::Published);
        $context->setPublishedAt($context->context()->originalPublishedAt() ?? new DateTimeImmutable('now', new DateTimeZone('UTC')));
    }
}
