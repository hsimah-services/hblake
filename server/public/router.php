<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/vendor/autoload.php';
use Hsimah\{App, Auth, GraphQLEndpoint, Http, Media};
use Eleph\Tsquid\{InitialData, Manifest};
use GraphQL\Language\Parser;

$path=parse_url(Http::server('REQUEST_URI') ?: '/',PHP_URL_PATH);
// Posts became News: keep old links working with a permanent redirect.
if (preg_match('#^/(admin/)?posts(/.*)?$#D',(string)$path,$old)===1) {
    $query=parse_url(Http::server('REQUEST_URI') ?: '/',PHP_URL_QUERY);
    header('Location: /'.($old[1] ?? '').'news'.($old[2] ?? '').(is_string($query) && $query!=='' ? '?'.$query : ''),true,301); return;
}
// Post images: staff upload them (multipart, CSRF) and anyone may fetch them by name.
if ($path==='/media' && Http::server('REQUEST_METHOD')==='POST') {
    header('Cache-Control: no-store');
    try { Media::upload(new Auth(App::database())); }
    catch (\Throwable $error) { error_log((string)$error); Auth::respond(400,['error'=>'The image could not be processed.']); }
}
if (str_starts_with((string)$path,'/media/')) { Media::serve((string)$path); return; }
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
        if ($path==='/auth/password') $auth->changePassword($input);
        if ($path!=='/graphql') Auth::respond(404,['error'=>'Not found.']);
        if (!is_string($input['query'] ?? null)) Auth::respond(400,['error'=>'Query required.']);
        $document=Parser::parse($input['query']);
        foreach($document->definitions as $definition) {
            if ($definition instanceof \GraphQL\Language\AST\OperationDefinitionNode && $definition->operation==='mutation') $auth->requireCsrf();
        }
        $app=new App(App::database(),$auth->actor());
        Auth::respond(200,GraphQLEndpoint::execute($app,$document,isset($input['variables']) ? Http::object($input['variables']) : null,is_string($input['operationName'] ?? null) ? $input['operationName'] : null));
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
header('Content-Type: text/html; charset=utf-8');
$shell=(string)file_get_contents($dist.'/index.html');
// Inline the initial route's query as #tsquid-data, executed as this request's viewer.
// Any failure serves the plain shell; the client then fetches the route query itself.
try {
    $auth=new Auth(App::database());
    $app=new App(App::database(),$auth->actor());
    $initial=new InitialData(
        Manifest::fromFile(dirname(__DIR__,2).'/generated/tsquid/tsquid-manifest.php'),
        // A response with errors is not inlined: withInitialData would hand it to Relay without
        // the client's error handling (tsquid#40), so the client fetches the route query itself.
        static function(string $text, array $variables, string $operation) use ($app): ?array {
            $result=GraphQLEndpoint::execute($app,$text,Http::object($variables),$operation);
            return ($result['errors'] ?? []) === [] ? $result : null;
        },
    );
    $response=$initial->render(Http::server('REQUEST_URI') ?: '/',$shell);
    foreach($response->headers as $name=>$value) header($name.': '.$value);
    echo $response->body;
} catch (\Throwable $error) {
    error_log((string)$error); echo $shell;
}
