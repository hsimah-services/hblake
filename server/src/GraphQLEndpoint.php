<?php
declare(strict_types=1);
namespace Hsimah;

use Eleph\Runtime\Verification\CommitRejected;
use GraphQL\GraphQL;
use GraphQL\Language\AST\DocumentNode;

/** Executes GraphQL for one viewer; shared by POST /graphql and inlined initial route data. */
final class GraphQLEndpoint {
    /**
     * @param array<string,mixed>|null $variables
     * @return array<string,mixed>
     */
    public static function execute(App $app, DocumentNode|string $query, ?array $variables, ?string $operation): array {
        $result=GraphQL::executeQuery(Schema::build($app),$query,null,null,$variables,$operation);
        $result->setErrorFormatter(static function(\Throwable $error): array {
            $previous=$error->getPrevious();
            if ($previous instanceof CommitRejected || $previous instanceof UserError) return ['message'=>$previous->getMessage()];
            error_log((string)$error);
            return ['message'=>'The request could not be processed.'];
        });
        return $result->toArray();
    }
}
