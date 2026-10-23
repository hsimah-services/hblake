using Elephentity.GraphQL;
using Elephentity.GraphQL.Http;
using Elephentity.Runtime.Gateway;
using Elephentity.Runtime.Policy;
using Elephentity.Runtime.Verification;
using GraphQL;
using GraphQL.Execution;
using GraphQL.SystemTextJson;
using GraphQL.Transport;
using GraphQL.Types;
using GraphQL.Validation;
using GraphQLParser.AST;

namespace Hsimah;

/// <summary>
/// Runs GraphQL for one request. It is <c>ElephentityGraphQLExecutor</c> with every operation executed serially: the runtime's edge
/// loader keeps an unsynchronised cache for the rows of one query, and GraphQL.NET resolves the fields of a list's items in parallel,
/// which corrupts it ("Operations that change non-concurrent collections must have exclusive access").
/// </summary>
public sealed class HsimahExecutor
{
    private readonly ISchema schema;
    private readonly ElephentityGraphQLOptions options;
    private readonly ILogger<HsimahExecutor> log;
    private readonly DocumentExecuter executer;

    public HsimahExecutor(ISchema schema, ElephentityGraphQLOptions options, ILogger<HsimahExecutor> log)
    {
        this.schema = schema;
        this.options = options;
        this.log = log;
        executer = new DocumentExecuter(
            new GraphQLDocumentBuilder(),
            new DocumentValidator(),
            new DefaultExecutionStrategySelector(
            [
                new ExecutionStrategyRegistration(SerialExecutionStrategy.Instance, OperationType.Query),
                new ExecutionStrategyRegistration(SerialExecutionStrategy.Instance, OperationType.Mutation),
                new ExecutionStrategyRegistration(SerialExecutionStrategy.Instance, OperationType.Subscription),
            ]),
            []);
        Serializer = new GraphQLSerializer(new ElephentityErrorInfoProvider());
    }

    public GraphQLSerializer Serializer { get; }

    public Task<ExecutionResult> ExecuteAsync(GraphQLRequest request, IServiceProvider services, CancellationToken cancellationToken = default) =>
        executer.ExecuteAsync(execution =>
        {
            execution.Schema = schema;
            execution.Query = request.Query;
            execution.OperationName = request.OperationName;
            execution.Variables = request.Variables;
            execution.Extensions = request.Extensions;
            execution.RequestServices = services;
            execution.CancellationToken = cancellationToken;
            execution.ThrowOnUnhandledException = false;
            execution.UnhandledExceptionDelegate = Unhandled;
            execution.ValidationRules = DocumentValidator.CoreRules.ToList();
        });

    private Task Unhandled(UnhandledExceptionContext context)
    {
        // A refusal or a bad request is the system working, so it is not an error in the log.
        if (context.OriginalException is not (AccessDeniedException or CommitRejectedException or EntityNotFoundException or GraphQLInputException or OperationCanceledException))
        {
            log.LogError(context.OriginalException, "Unhandled exception resolving {Field}.", context.FieldContext?.FieldDefinition?.Name);
        }

        return Task.CompletedTask;
    }
}
