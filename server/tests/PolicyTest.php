<?php
declare(strict_types=1);
namespace Hsimah\Tests;
use PHPUnit\Framework\TestCase;
use Hsimah\{Actor, ContentStaff, AdminAccounts};
use Hsimah\Entity\User\{User, UserWriteContext};
use Hsimah\Entity\Enum\UserRole;
use Eleph\Runtime\Identity\EntityId;
use Eleph\Runtime\Mutation\Mutation;
use Eleph\Runtime\Policy\{PendingWrite, PolicyOutcome};
use DateTimeImmutable;
final class PolicyTest extends TestCase {
    public function testEditorMayWriteContentButCannotDeleteOrEditAccounts(): void {
        $editor=new Actor(self::user(UserRole::Editor,true));
        $write=PendingWrite::update('Page',new Mutation('Page',EntityId::of(1)));
        self::assertSame(PolicyOutcome::Allow,(new ContentStaff())->decide(null,$write,$editor)->outcome);
        self::assertSame(PolicyOutcome::Deny,(new ContentStaff())->decide(null,PendingWrite::delete('Page'),$editor)->outcome);
        $profile=UserWriteContext::of(PendingWrite::update('User',new Mutation('User',EntityId::of(1))));
        self::assertSame(PolicyOutcome::Deny,(new AdminAccounts())->decide(null,$profile,$editor)->outcome);
        self::assertSame(PolicyOutcome::Allow,(new AdminAccounts())->decide(null,$profile,new Actor(self::user(UserRole::Admin,true)))->outcome);
    }
    public function testInactiveAdminCannotWrite(): void {
        $actor=new Actor(self::user(UserRole::Admin,false));
        self::assertFalse($actor->isAuthenticated());
        self::assertSame(PolicyOutcome::Deny,(new ContentStaff())->decide(null,PendingWrite::delete('Page'),$actor)->outcome);
    }
    private static function user(UserRole $role,bool $active): User {
        $now=new DateTimeImmutable('now');
        return User::of(EntityId::of(1),$now,$now,'operator@example.test','Operator',$role,$active);
    }
}
