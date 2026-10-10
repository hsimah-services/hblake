<?php
declare(strict_types=1);
namespace Hsimah;

use Hsimah\Entity\Enum\PublicationStatus;
use Hsimah\Entity\Page\PageUnpublishContext;
use Hsimah\Entity\Post\PostUnpublishContext;
use Hsimah\Entity\Product\ProductUnpublishContext;
use Hsimah\Entity\Page\Contract\PageUnpublishAction;
use Hsimah\Entity\Post\Contract\PostUnpublishAction;
use Hsimah\Entity\Product\Contract\ProductUnpublishAction;
final class Unpublish implements PageUnpublishAction, PostUnpublishAction, ProductUnpublishAction {
    public function handle(PageUnpublishContext|PostUnpublishContext|ProductUnpublishContext $context): void { $context->setStatus(PublicationStatus::Draft); }
}
