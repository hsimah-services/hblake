<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\Enum\PageAccent;
use Hsimah\Entity\Page\PageMutationContext;
use Hsimah\Entity\Page\Contract\{PageAccentVerifier, PageHomeOrderVerifier, PageNavigationOrderVerifier};

/**
 * Page placement rules (Page.md): orders are whole numbers from 0 to 999, and a page
 * featured on the home page needs a colour for its tile (not the neutral ink).
 */
final class PagePlacement implements PageAccentVerifier, PageHomeOrderVerifier, PageNavigationOrderVerifier {
    public function verify(PageAccent|int $value, PageMutationContext $context): Verification {
        if (is_int($value)) return Rules::check($value >= 0 && $value <= 999, 'Use an order from 0 to 999.');
        return Rules::check($value !== PageAccent::Ink || $context->pending('featureOnHome') !== true, 'Choose a colour for a page featured on the home page.');
    }
}
