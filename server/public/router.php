<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/vendor/autoload.php';
use Hsimah\{App, Auth, Schema, Http};
use GraphQL\GraphQL;
use GraphQL\Language\Parser;

$path=parse_url(Http::server('REQUEST_URI') ?: '/',PHP_URL_PATH);
if ($path==='/graphql' || str_starts_with((string)$path,'/auth/')) {
    header('Cache-Control: no-store');
    try {
        $auth=new Auth(App::database());
        if ($path==='/auth/csrf' && Http::server('REQUEST_METHOD')==='GET') Auth::respond(200,['token'=>$auth->csrf()]);
        if (Http::server('REQUEST_METHOD')!=='POST') Auth::respond(405,['error'=>'POST required.']);
        if ((int)(Http::server('CONTENT_LENGTH'))>1048576) Auth::respond(413,['error'=>'Request too large.']);
        $raw=file_get_contents('php://input',false,null,0,1048577);
        if ($raw===false || strlen($raw)>1048576) Auth::respond(413,['error'=>'Request too large.']);
        $input=Http::object(json_decode($raw==='' ? '{}' : $raw,true,512,JSON_THROW_ON_ERROR));
        if ($path==='/auth/login') $auth->login($input);
        if ($path==='/auth/logout') $auth->logout();
        if ($path!=='/graphql') Auth::respond(404,['error'=>'Not found.']);
        if (!is_string($input['query'] ?? null)) Auth::respond(400,['error'=>'Query required.']);
        $document=Parser::parse($input['query']);
        foreach($document->definitions as $definition) {
            if ($definition instanceof \GraphQL\Language\AST\OperationDefinitionNode && $definition->operation==='mutation') $auth->requireCsrf();
        }
        $app=new App(App::database(),$auth->actor());
        $result=GraphQL::executeQuery(Schema::build($app),$document,null,null,isset($input['variables']) ? Http::object($input['variables']) : null,is_string($input['operationName'] ?? null) ? $input['operationName'] : null);
        $result->setErrorFormatter(static function(\Throwable $error): array {
            $previous=$error->getPrevious();
            $message=$previous instanceof \RuntimeException || $previous instanceof \InvalidArgumentException ? $previous->getMessage() : $error->getMessage();
            return ['message'=>$message];
        });
        Auth::respond(200,$result->toArray());
    } catch (\Throwable $error) {
        error_log((string)$error); Auth::respond(400,['errors'=>[['message'=>'The request could not be processed.']]]);
    }
}
$dist=dirname(__DIR__,2).'/client/dist';
$file=realpath($dist.(string)$path);
if ($file!==false && str_starts_with($file,$dist.'/') && is_file($file)) {
    $types=['js'=>'application/javascript','css'=>'text/css','svg'=>'image/svg+xml','png'=>'image/png','ico'=>'image/x-icon'];
    header('Content-Type: '.($types[pathinfo($file,PATHINFO_EXTENSION)] ?? 'application/octet-stream')); readfile($file); return;
}
if (preg_match('#^/(?:\.git|vendor|spec|generated|server|\.var|\.env|composer\.)#',(string)$path)) { http_response_code(404); echo 'Not found'; return; }
header('Content-Type: text/html; charset=utf-8'); readfile($dist.'/index.html');
