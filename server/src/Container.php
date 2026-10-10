<?php
declare(strict_types=1);
namespace Hsimah;

use Psr\Container\ContainerInterface;
use Closure;
use RuntimeException;
final class Container implements ContainerInterface {
    /** @var array<string, object> */
    private array $services = [];
    /** @param array<string, Closure(ContainerInterface): object> $factories */
    public function __construct(private array $factories) {}
    public function set(string $id, object $value): void { $this->services[$id] = $value; }
    public function has(string $id): bool { return isset($this->services[$id]) || isset($this->factories[$id]); }
    public function get(string $id): object {
        return $this->services[$id] ??= isset($this->factories[$id])
            ? ($this->factories[$id])($this)
            : throw new RuntimeException('Missing service '.$id);
    }
}
