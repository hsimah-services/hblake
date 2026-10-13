<?php
declare(strict_types=1);
namespace Hsimah\Tests;
use PHPUnit\Framework\TestCase;
use Hsimah\Rules;
final class RulesTest extends TestCase {
    public function testTrustBoundaries(): void {
        self::assertTrue(Rules::slug('valid-slug')->isOk());
        foreach(['Upper','a--b','../x','',str_repeat('a',161)] as $slug) self::assertFalse(Rules::slug($slug)->isOk());
        foreach(['javascript:alert(1)','http://example.test','mailto:broken','https://'] as $url) self::assertFalse(Rules::enquiry($url)->isOk());
        self::assertTrue(Rules::enquiry('https://example.test/contact')->isOk());
        self::assertTrue(Rules::enquiry('mailto:operator@example.test')->isOk());
        self::assertTrue(Rules::username('adminhabl')->isOk());
        foreach([' adminhabl ','AdminHabl','ab','-admin','admin@example.test','admin habl',str_repeat('a',33)] as $username) self::assertFalse(Rules::username($username)->isOk());
        self::assertFalse(Rules::password(str_repeat('a',11))->isOk());
        self::assertTrue(Rules::password(str_repeat('a',12))->isOk());
        self::assertFalse(Rules::title('   ')->isOk());
    }
}
