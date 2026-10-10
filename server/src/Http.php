<?php
declare(strict_types=1);
namespace Hsimah;
use InvalidArgumentException;
final class Http {
    public static function server(string $name): string { $value=$_SERVER[$name] ?? ''; return is_string($value) ? $value : ''; }
    /** @return array<string,mixed> */
    public static function object(mixed $value): array {
        if (!is_array($value)) throw new InvalidArgumentException('Expected an object.');
        $result=[];
        foreach($value as $key=>$item) {
            if (!is_string($key)) throw new InvalidArgumentException('Expected named object keys.');
            $result[$key]=$item;
        }
        return $result;
    }
}
