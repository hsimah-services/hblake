using Elephentity.Runtime.Catalogue;
using Elephentity.Runtime.Storage;
using Elephentity.Runtime.Testing;
using Hsimah;
using Microsoft.Extensions.DependencyInjection;

// `eleph check` runs this (eleph.json: targets.csharp.check): every contract the generated code declares must resolve to an
// implementation the application registers.
var services = new ServiceCollection().AddLogging();
services.AddSingleton<IStorageAdaptor>(new Elephentity.Runtime.Memory.MemoryAdaptor());
services.AddSingleton(new HsimahOptions());
services.AddSingleton<Hsimah.Assets.IAssetStore>(new Hsimah.Assets.FileSystemAssetStore(Path.Combine(Path.GetTempPath(), "hsimah-contracts")));
services.AddHsimahDomain();
using var provider = services.BuildServiceProvider();
return ContractCheck.TryRunConsole(args, provider.GetRequiredService<IEntityCatalogue>(), provider, Console.Out, out var exitCode)
    ? exitCode
    : 2;
