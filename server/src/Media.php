<?php
declare(strict_types=1);
namespace Hsimah;

/**
 * Images for post bodies. Uploads are staff-only and CSRF-protected. Each is checked by
 * content (PNG, JPEG or WebP), bounded in bytes and pixels, turned upright and re-encoded
 * with GD, which drops EXIF, location and any other embedded data, then stored under a
 * random name in a private directory beside the database and served by this class.
 */
final class Media {
    public const MAX_BYTES = 5_242_880;
    public const MAX_PIXELS = 8000;
    private const TYPES = ['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp'];
    private const SERVED = ['png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp'];

    /** The private media directory: HSIMAH_MEDIA, or `media` beside the database file. */
    public static function directory(): string {
        $configured=getenv('HSIMAH_MEDIA');
        if (is_string($configured) && $configured!=='') return $configured;
        $database=getenv('HSIMAH_DATABASE') ?: dirname(__DIR__,2).'/.var/site.sqlite';
        return ($database===':memory:' ? sys_get_temp_dir().'/hsimah' : dirname($database)).'/media';
    }

    public static function upload(Auth $auth): never {
        $auth->requireCsrf();
        $actor=$auth->actor();
        if (!$actor->hasRole('admin') && !$actor->hasRole('editor')) Auth::respond(403,['error'=>'Sign in to upload images.']);
        $file=$_FILES['image'] ?? null;
        if (!is_array($file) || !is_string($file['tmp_name'] ?? null) || !is_int($file['error'] ?? null)) Auth::respond(400,['error'=>'Choose an image to upload.']);
        if (in_array($file['error'],[UPLOAD_ERR_INI_SIZE,UPLOAD_ERR_FORM_SIZE],true) || (is_int($file['size'] ?? null) && $file['size']>self::MAX_BYTES)) Auth::respond(413,['error'=>'Images must be 5 MB or smaller.']);
        if ($file['error']!==UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) Auth::respond(400,['error'=>'The upload did not complete. Try again.']);
        $url=self::store($file['tmp_name']);
        Auth::respond(201,['url'=>$url]);
    }

    /** Validates and re-encodes an image file; returns its public URL. Refuses with a JSON error. */
    public static function store(string $path): string {
        $type=(new \finfo(FILEINFO_MIME_TYPE))->file($path);
        $extension=is_string($type) ? (self::TYPES[$type] ?? null) : null;
        if ($extension===null) Auth::respond(415,['error'=>'Use a PNG, JPEG or WebP image.']);
        $size=@getimagesize($path);
        if ($size===false || $size[0]<1 || $size[1]<1) Auth::respond(415,['error'=>'That file is not a readable image.']);
        if ($size[0]>self::MAX_PIXELS || $size[1]>self::MAX_PIXELS) Auth::respond(413,['error'=>'Images must be at most 8000 pixels on each side.']);
        $image=match ($extension) { 'png'=>@imagecreatefrompng($path), 'jpg'=>@imagecreatefromjpeg($path), 'webp'=>@imagecreatefromwebp($path) };
        if (!$image instanceof \GdImage) Auth::respond(415,['error'=>'That file is not a readable image.']);
        if ($extension==='jpg') $image=self::upright($image,self::orientation($path));
        $directory=self::directory();
        if (!is_dir($directory) && !mkdir($directory,0700,true) && !is_dir($directory)) throw new \RuntimeException('Media directory unavailable.');
        $name=bin2hex(random_bytes(16)).'.'.$extension;
        $target=$directory.'/'.$name;
        if ($extension==='png') { imagesavealpha($image,true); $saved=imagepng($image,$target,9); }
        elseif ($extension==='webp') { imagesavealpha($image,true); $saved=imagewebp($image,$target,85); }
        else $saved=imagejpeg($image,$target,85);
        if (!$saved) throw new \RuntimeException('Could not save the image.');
        chmod($target,0600);
        return '/media/'.$name;
    }

    /** Serves /media/<32 hex>.<png|jpg|webp>; anything else is not found. */
    public static function serve(string $path): void {
        if (preg_match('#^/media/([a-f0-9]{32})\.(png|jpg|webp)$#D',$path,$match)!==1 || !is_file(self::directory().'/'.$match[1].'.'.$match[2])) {
            http_response_code(404); header('Content-Type: text/plain'); echo 'Not found'; return;
        }
        header('Content-Type: '.self::SERVED[$match[2]]);
        header('X-Content-Type-Options: nosniff');
        header("Content-Security-Policy: default-src 'none'; sandbox");
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile(self::directory().'/'.$match[1].'.'.$match[2]);
    }

    /** EXIF orientation (1–8) from a JPEG's APP1 segment, or 1. */
    private static function orientation(string $path): int {
        $data=(string)file_get_contents($path,false,null,0,131072);
        $offset=2;
        while ($offset+4<=strlen($data) && $data[$offset]==="\xFF") {
            $marker=ord($data[$offset+1]); $length=self::read($data,$offset+2,2,false);
            if ($marker===0xE1 && substr($data,$offset+4,6)==="Exif\0\0") {
                $tiff=substr($data,$offset+10,max(0,$length-8));
                $little=substr($tiff,0,2)==='II';
                $ifd=self::read($tiff,4,4,$little);
                for ($entry=0,$count=self::read($tiff,$ifd,2,$little); $entry<$count; $entry++) {
                    $at=$ifd+2+$entry*12;
                    if (self::read($tiff,$at,2,$little)===0x0112) {
                        $value=self::read($tiff,$at+8,2,$little);
                        return $value>=1 && $value<=8 ? $value : 1;
                    }
                }
                return 1;
            }
            if ($marker===0xDA || $length<2) break;
            $offset+=2+$length;
        }
        return 1;
    }

    /** An unsigned 16- or 32-bit integer at $at, or 0 past the end. */
    private static function read(string $bytes, int $at, int $width, bool $little): int {
        $chunk=substr($bytes,$at,$width);
        if (strlen($chunk)!==$width) return 0;
        $value=unpack($width===2 ? ($little ? 'v' : 'n') : ($little ? 'V' : 'N'),$chunk);
        return is_array($value) && is_int($value[1] ?? null) ? $value[1] : 0;
    }

    private static function upright(\GdImage $image, int $orientation): \GdImage {
        if (in_array($orientation,[2,4,5,7],true)) imageflip($image,IMG_FLIP_HORIZONTAL);
        $angle=match ($orientation) { 3,4=>180, 5,6=>270, 7,8=>90, default=>0 };
        if ($angle===0) return $image;
        $rotated=imagerotate($image,$angle,0);
        return $rotated instanceof \GdImage ? $rotated : $image;
    }
}
