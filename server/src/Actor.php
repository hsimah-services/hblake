<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Policy\{Viewer, ViewerProvider};
use Hsimah\Entity\User\User;
final readonly class Actor implements Viewer, ViewerProvider {
    public function __construct(public ?User $user = null, private bool $bootstrap = false) {}
    public function id(): ?string { return $this->user === null ? null : (string)$this->user->getId(); }
    public function isAuthenticated(): bool { return $this->bootstrap || ($this->user?->getActive() ?? false); }
    public function hasRole(string $role): bool {
        return $this->isAuthenticated() && ($this->bootstrap ? $role === 'admin' : $this->user?->getRole()->value === $role);
    }
    public function can(string $capability): bool { return false; }
    public function viewer(): Viewer { return $this; }
}
