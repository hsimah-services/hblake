<?php
declare(strict_types=1);
namespace Hsimah;

use Hsimah\Entity\Enum\PublicationStatus;
use Hsimah\Entity\Page\PageUnpublishContext;
use Hsimah\Entity\PageItem\PageItemUnpublishContext;
use Hsimah\Entity\Page\Contract\PageUnpublishAction;
use Hsimah\Entity\PageItem\Contract\PageItemUnpublishAction;
final class Unpublish implements PageUnpublishAction, PageItemUnpublishAction {
    public function handle(PageUnpublishContext|PageItemUnpublishContext $context): void { $context->setStatus(PublicationStatus::Draft); }
}
