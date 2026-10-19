<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Verification\Verification;
use Hsimah\Entity\PageItem\Contract\PageItemImageAltVerifier;
use Hsimah\Entity\PageItem\Contract\PageItemImageUrlVerifier;
use Hsimah\Entity\PageItem\PageItemMutationContext;
/** An item's image: a stored upload (/media/<name>) that always has alt text. */
final class ImageVerifier implements PageItemImageUrlVerifier, PageItemImageAltVerifier {
    public function __construct(private readonly string $field) {}
    public function verify(?string $value, PageItemMutationContext $context): Verification {
        $url = $context->pendingImageUrl(); $alt = $context->pendingImageAlt();
        if ($this->field === 'url') return $value === null ? Verification::ok() : Rules::image($value, $alt);
        return Rules::check($url === null || ($alt !== null && trim($alt) !== ''), 'Describe the image in its alt text.');
    }
}
