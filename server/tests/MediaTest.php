<?php
declare(strict_types=1);
namespace Hsimah\Tests;
use PHPUnit\Framework\TestCase;
use Hsimah\Media;
final class MediaTest extends TestCase {
    private string $directory;
    protected function setUp(): void {
        $this->directory=sys_get_temp_dir().'/hsimah-media-test-'.bin2hex(random_bytes(4));
        putenv('HSIMAH_MEDIA='.$this->directory);
    }
    protected function tearDown(): void {
        putenv('HSIMAH_MEDIA');
        foreach (glob($this->directory.'/*') ?: [] as $file) unlink($file);
        if (is_dir($this->directory)) rmdir($this->directory);
    }
    public function testJpegIsTurnedUprightAndStrippedOfExif(): void {
        // A 40×20 JPEG whose EXIF says "rotate 90° clockwise" (orientation 6) and carries a GPS tag.
        $image=imagecreatetruecolor(40,20); ob_start(); imagejpeg($image); $jpeg=(string)ob_get_clean();
        $tiff="MM\0\x2A\0\0\0\x08\0\x02"."\x01\x12\0\x03\0\0\0\x01\0\x06\0\0"."\x88\x25\0\x04\0\0\0\x01\0\0\0\0"."\0\0\0\0";
        $exif="Exif\0\0".$tiff;
        $path=tempnam(sys_get_temp_dir(),'jpg'); assert(is_string($path));
        file_put_contents($path,substr($jpeg,0,2)."\xFF\xE1".pack('n',strlen($exif)+2).$exif.substr($jpeg,2));
        $url=Media::store($path); unlink($path);
        self::assertMatchesRegularExpression('#^/media/[a-f0-9]{32}\.jpg$#',$url);
        $stored=$this->directory.'/'.basename($url);
        self::assertStringNotContainsString('Exif',(string)file_get_contents($stored));
        $size=getimagesize($stored); assert($size!==false);
        self::assertSame([20,40],[$size[0],$size[1]]);
        self::assertSame('0600',substr(sprintf('%o',fileperms($stored)),-4));
    }
}
