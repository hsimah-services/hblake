<?php
declare(strict_types=1);
namespace Hsimah;

use DateTimeImmutable;
use DateTimeZone;
use Hsimah\Entity\Enum\PublicationStatus;
use Hsimah\Entity\Page\PagePublishContext;
use Hsimah\Entity\Post\PostPublishContext;
use Hsimah\Entity\Product\ProductPublishContext;
use Hsimah\Entity\Page\Contract\PagePublishAction;
use Hsimah\Entity\Post\Contract\PostPublishAction;
use Hsimah\Entity\Product\Contract\ProductPublishAction;
final class Publish implements PagePublishAction, PostPublishAction, ProductPublishAction {
    // shortcut: action contexts expose writes only; remove this adapter after upstream provides original state.
    public ?DateTimeImmutable $originalTime = null;
    public function handle(PagePublishContext|PostPublishContext|ProductPublishContext $context): void {
        $context->setStatus(PublicationStatus::Published);
        $context->setPublishedAt($this->originalTime ?? new DateTimeImmutable('now', new DateTimeZone('UTC')));
    }
}
