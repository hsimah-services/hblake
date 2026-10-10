<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\SQLite\Database;
use Eleph\Runtime\Identity\EntityId;

final class Auth {
    public const COOKIE = 'hsimah_session';
    /** @var array{token_hash:string,user_id:int|null,csrf:string,expires_at:int}|null */
    private ?array $session = null;
    public function __construct(private Database $db) {
        $cookie = $_COOKIE[self::COOKIE] ?? '';
        /** @var list<array{token_hash:string,user_id:int|null,csrf:string,expires_at:int}> $rows */
        $rows = is_string($cookie) && preg_match('/^[a-f0-9]{64}$/D',$cookie)
            ? $db->select('SELECT * FROM auth_session WHERE token_hash = ? AND expires_at > ?', [hash('sha256',$cookie),time()]) : [];
        if ($rows) { $this->session=$rows[0]; }
    }
    public static function install(Database $db): void {
        $db->pdo->exec('CREATE TABLE auth_credential (user_id INTEGER PRIMARY KEY REFERENCES hsimah_user(id), password_hash TEXT NOT NULL);
            CREATE TABLE auth_session (token_hash TEXT PRIMARY KEY, user_id INTEGER REFERENCES hsimah_user(id), csrf TEXT NOT NULL, expires_at INTEGER NOT NULL);
            CREATE TABLE auth_failure (address TEXT PRIMARY KEY, attempts INTEGER NOT NULL, started_at INTEGER NOT NULL);');
    }
    public function csrf(): string { if ($this->session===null) $this->rotate(null); assert($this->session!==null); return $this->session['csrf']; }
    public function requireCsrf(): void {
        $token=$_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if ($this->session===null || !is_string($token) || !hash_equals($this->session['csrf'],$token)) { self::respond(403,['error'=>'Invalid CSRF token.']); }
    }
    public function actor(): Actor {
        $id=$this->session['user_id'] ?? null;
        if ($id === null) return new Actor();
        $app = new App($this->db,new Actor(bootstrap:true));
        $user=$app->runtime->find('User',EntityId::of((int)$id));
        return $user instanceof \Hsimah\Entity\User\User && $user->getActive() ? new Actor($user) : new Actor();
    }
    /** @param array<string,mixed> $input */
    public function login(array $input): never {
        $this->requireCsrf();
        $this->purgeExpired();
        $address=Http::server('REMOTE_ADDR') ?: 'local';
        /** @var array{started_at:int,attempts:int}|null $fail */
        $fail=$this->db->select('SELECT * FROM auth_failure WHERE address=?',[$address])[0] ?? null;
        if ($fail && (int)$fail['started_at'] > time()-900 && (int)$fail['attempts'] >= 12) self::respond(429,['error'=>'Try again later.']);
        $email=is_string($input['email'] ?? null) ? strtolower(trim($input['email'])) : '';
        $password=is_string($input['password'] ?? null) ? $input['password'] : '';
        /** @var array{id:int,active:int,password_hash:string}|null $row */
        $row=$this->db->select('SELECT u.id,u.active,c.password_hash FROM hsimah_user u JOIN auth_credential c ON c.user_id=u.id WHERE u.email=?',[$email])[0] ?? null;
        // Always verify a hash, including unknown accounts.
        $hash=$row['password_hash'] ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi';
        $valid=password_verify($password,(string)$hash);
        if (!$row || !$valid || !(bool)$row['active']) {
            $this->db->execute('INSERT INTO auth_failure(address,attempts,started_at) VALUES (?,1,?) ON CONFLICT(address) DO UPDATE SET attempts=CASE WHEN started_at < ? THEN 1 ELSE attempts+1 END, started_at=CASE WHEN started_at < ? THEN excluded.started_at ELSE started_at END',[$address,time(),time()-900,time()-900]);
            self::respond(401,['error'=>'Invalid email or password.']);
        }
        $this->db->execute('DELETE FROM auth_failure WHERE address=?',[$address]);
        $this->rotate((int)$row['id']);
        $viewer=Schema::viewer($this->actor()); if ($viewer!==null) $viewer['role']=strtoupper($viewer['role']);
        self::respond(200,['viewer'=>$viewer]);
    }
    public function logout(): never { $this->requireCsrf(); $this->rotate(null); self::respond(200,['ok'=>true]); }
    public function purgeExpired(): void {
        $this->db->execute('DELETE FROM auth_session WHERE expires_at <= ?', [time()]);
        $this->db->execute('DELETE FROM auth_failure WHERE started_at <= ?', [time()-900]);
    }
    private function rotate(?int $id): void {
        $this->purgeExpired();
        if ($this->session!==null) $this->db->execute('DELETE FROM auth_session WHERE token_hash=?',[$this->session['token_hash']]);
        $raw=bin2hex(random_bytes(32));
        $this->session=['token_hash'=>hash('sha256',$raw),'user_id'=>$id,'csrf'=>bin2hex(random_bytes(32)),'expires_at'=>time()+28800];
        $this->db->insert('auth_session',$this->session);
        setcookie(self::COOKIE,$raw,['expires'=>time()+28800,'path'=>'/','secure'=>self::secureCookie(),'httponly'=>true,'samesite'=>'Lax']);
    }
    private static function secureCookie(): bool {
        $https=strtolower(Http::server('HTTPS'));
        $host=parse_url('http://'.Http::server('HTTP_HOST'), PHP_URL_HOST);
        return ($https!=='' && $https!=='off') || !in_array($host,['localhost','127.0.0.1','[::1]'],true);
    }
    /** @param array<string,mixed> $body */
    public static function respond(int $status,array $body): never {
        http_response_code($status); header('Content-Type: application/json'); header('Cache-Control: no-store');
        echo json_encode($body,JSON_THROW_ON_ERROR); exit;
    }
}
