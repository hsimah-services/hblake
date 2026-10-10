<?php
declare(strict_types=1);
namespace Hsimah;

use DateTimeImmutable;
use Eleph\Runtime\Mutation\MutationContext;
use Eleph\Runtime\Verification\{Verification, Violation};
use Hsimah\Entity\Enum\PublicationStatus;
final class Rules {
    public static function check(bool $valid, string $message): Verification {
        return $valid ? Verification::ok() : Verification::failed(new Violation('invalid', $message));
    }
    public static function title(string $value, int $max = 200): Verification {
        return self::check(trim($value) !== '' && mb_strlen($value) <= $max, 'A nonblank title/name within the length limit is required.');
    }
    public static function slug(string $value): Verification {
        return self::check(strlen($value) <= 160 && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $value) === 1, 'Use a lowercase slug with single hyphens, up to 160 characters.');
    }
    public static function content(string $value, MutationContext $context): Verification {
        return self::check($context->pending('status') !== PublicationStatus::Published || trim($value) !== '', 'Published content cannot be blank.');
    }
    public static function publication(MutationContext $context): Verification {
        $names = array_map(static fn($action): string => $action->name, $context->actions());
        $status = $context->pending('status'); $time = $context->pending('publishedAt');
        $original = $context->original('publishedAt');
        $valid = $context->isCreate()
            ? $status === PublicationStatus::Draft && $time === null
            : (in_array('publish', $names, true)
                ? $status === PublicationStatus::Published && $time instanceof DateTimeImmutable && ($original === null ? abs($time->getTimestamp()-time()) < 10 : $time == $original)
                : (in_array('unpublish', $names, true)
                    ? $status === PublicationStatus::Draft && $time == $original
                    : $status === $context->original('status') && $time == $original));
        $valid = $valid && ($status !== PublicationStatus::Published || (is_string($context->pending('content')) && trim($context->pending('content')) !== ''));
        return self::check($valid, 'Publication changes require a valid publish/unpublish action.');
    }
    public static function enquiry(string $value): Verification {
        $valid = strlen($value) <= 2048 && (str_starts_with($value, 'https://') && filter_var($value, FILTER_VALIDATE_URL) !== false && parse_url($value, PHP_URL_HOST) !== null
            || str_starts_with($value, 'mailto:') && filter_var(substr($value, 7), FILTER_VALIDATE_EMAIL) !== false);
        return self::check($valid, 'Use a valid HTTPS URL or mailto email address.');
    }
    public static function email(string $value): Verification {
        return self::check(strlen($value) <= 254 && $value === strtolower(trim($value)) && filter_var($value, FILTER_VALIDATE_EMAIL) !== false, 'A normalized email address is required.');
    }
}
