using Elephentity.GraphQL;
using Hsimah;
using Hsimah.Http;
using Microsoft.Extensions.DependencyInjection;

var options = HsimahOptions.FromEnvironment();

static void AddApplication(IServiceCollection services, HsimahOptions options)
{
    services.AddHsimah(options);
    services.AddSingleton<AuthService>();
    services.AddSingleton<Media>();
}

if (args is ["console", "schema"])
{
    var schemaServices = new ServiceCollection().AddLogging();
    schemaServices.AddHsimah(options);
    using var provider = schemaServices.BuildServiceProvider();
    Console.Out.Write(ElephentitySchemaPrinter.Print(provider.GetRequiredService<global::GraphQL.Types.ISchema>()));
    return 0;
}

if (args is ["console", ..])
{
    var consoleServices = new ServiceCollection().AddLogging();
    AddApplication(consoleServices, options);
    using var provider = consoleServices.BuildServiceProvider();
    return await Operator.RunAsync(args[1..], provider).ConfigureAwait(false);
}

var builder = WebApplication.CreateBuilder(args);
AddApplication(builder.Services, options);
builder.WebHost.ConfigureKestrel(kestrel => kestrel.Limits.MaxRequestBodySize = 16 * 1024 * 1024);
if (Environment.GetEnvironmentVariable("ASPNETCORE_URLS") is not { Length: > 0 })
{
    var port = Uri.TryCreate(Environment.GetEnvironmentVariable("BASE_URL"), UriKind.Absolute, out var origin) ? origin.Port : 8080;
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

var app = builder.Build();
app.UseMiddleware<Router>();
await app.RunAsync().ConfigureAwait(false);
return 0;
