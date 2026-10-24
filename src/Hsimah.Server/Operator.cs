using System.Formats.Tar;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Elephentity.Cosmos;
using Elephentity.Runtime.Gateway;
using Elephentity.Runtime.Storage;
using Hsimah.Assets;
using Hsimah.Domain;
using Hsimah.Entity;
using Hsimah.Http;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.DependencyInjection;
using Elephentity.Cosmos.Manifest;

namespace Hsimah;

/// <summary>The operator commands: install, bootstrap, launch content, backup and restore, and the two acceptance test hooks.</summary>
public static class Operator
{
    public static async Task<int> RunAsync(string[] args, IServiceProvider services)
    {
        try
        {
            using var scope = RequestViewerProvider.Use(Actor.Operator);
            var command = args.Length > 0 ? args[0] : string.Empty;
            switch (command)
            {
                case "install": await InstallAsync(services).ConfigureAwait(false); break;
                case "reset": await ResetAsync(services).ConfigureAwait(false); break;
                case "bootstrap": await BootstrapAsync(services).ConfigureAwait(false); break;
                case "replace-content": await ReplaceContentAsync(services).ConfigureAwait(false); Console.WriteLine("Site content replaced."); break;
                case "backup": await BackupAsync(services, args.ElementAtOrDefault(1) ?? string.Empty).ConfigureAwait(false); break;
                case "restore": await RestoreAsync(services, args.ElementAtOrDefault(1) ?? string.Empty).ConfigureAwait(false); break;
                case "expire-sessions": await services.GetRequiredService<AuthService>().ExpireAll(CancellationToken.None).ConfigureAwait(false); break;
                case "set-active": await SetActiveAsync(services, args.ElementAtOrDefault(1)).ConfigureAwait(false); break;
                default: throw new InvalidOperationException("Unknown operator command.");
            }

            return 0;
        }
        catch (Exception error)
        {
            await Console.Error.WriteLineAsync(error.Message).ConfigureAwait(false);
            return 1;
        }
    }

    /// <summary>
    /// Deletes the whole database and every stored image. For acceptance stacks only: it refuses any database whose name does not end in "-acceptance", so a
    /// mistaken environment cannot lose real data.
    /// </summary>
    private static async Task ResetAsync(IServiceProvider services)
    {
        var options = services.GetRequiredService<HsimahOptions>();
        if (!options.Database.EndsWith("-acceptance", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Refusing to reset a database that is not an acceptance database.");
        }

        var assets = services.GetRequiredService<IAssetStore>();
        foreach (var name in await assets.ListAsync(CancellationToken.None).ConfigureAwait(false))
        {
            await assets.DeleteAsync(name, CancellationToken.None).ConfigureAwait(false);
        }

        try
        {
            await services.GetRequiredService<CosmosClient>().GetDatabase(options.Database).DeleteAsync().ConfigureAwait(false);
        }
        catch (CosmosException error) when (error.StatusCode == HttpStatusCode.NotFound)
        {
        }
    }

    /// <summary>Creates the database and containers. Refuses a populated content container and changes nothing.</summary>
    private static async Task InstallAsync(IServiceProvider services)
    {
        var client = services.GetRequiredService<CosmosClient>();
        var options = services.GetRequiredService<HsimahOptions>();
        var manifest = services.GetRequiredService<CosmosStorageManifest>();
        await CosmosInstaller.InstallAsync(client, options.Database, manifest).ConfigureAwait(false);
        var auth = new ContainerProperties(options.AuthContainer, "/pk") { DefaultTimeToLive = -1 };
        await client.GetDatabase(options.Database).CreateContainerIfNotExistsAsync(auth).ConfigureAwait(false);
    }

    private static async Task BootstrapAsync(IServiceProvider services)
    {
        var runtime = services.GetRequiredService<Elephentity.Runtime.Gateway.Runtime>();
        if (await runtime.All("User").CountAsync().ConfigureAwait(false) != 0)
        {
            throw new InvalidOperationException("An account already exists.");
        }

        var username = (Environment.GetEnvironmentVariable("ADMIN_USERNAME") ?? string.Empty).Trim().ToLowerInvariant();
        var password = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? string.Empty;
        if (!Rules.Password(password).IsOk)
        {
            throw new InvalidOperationException("Operator password must contain at least 12 characters.");
        }

        var displayName = Environment.GetEnvironmentVariable("ADMIN_DISPLAY_NAME") is { Length: > 0 } name ? name : "Site Operator";
        var created = await runtime.CreateAsync("User", new Dictionary<string, object?>
        {
            ["username"] = username,
            ["displayName"] = displayName,
            ["role"] = "admin",
            ["active"] = true,
        }).ConfigureAwait(false);
        await services.GetRequiredService<AuthService>().SetPassword(created.Id.ToString(), password, CancellationToken.None).ConfigureAwait(false);
    }

    /// <summary>Replaces all Page and PageItem content with the owner's launch pages; accounts, credentials and sessions are kept.</summary>
    public static async Task ReplaceContentAsync(IServiceProvider services)
    {
        var runtime = services.GetRequiredService<Elephentity.Runtime.Gateway.Runtime>();
        var options = services.GetRequiredService<HsimahOptions>();
        var pages = JsonNode.Parse(await File.ReadAllTextAsync(options.ContentFile).ConfigureAwait(false))!.AsArray();
        foreach (var entity in new[] { "PageItem", "Page" })
        {
            foreach (var row in await runtime.All(entity).AllAsync().ConfigureAwait(false))
            {
                await runtime.DeleteAsync(entity, row switch { Page page => page.Id, PageItem item => item.Id, _ => throw new InvalidOperationException() }).ConfigureAwait(false);
            }
        }

        var author = (await runtime.All("User").AllAsync().ConfigureAwait(false)).OfType<User>().Where(user => user.Active).OrderBy(user => user.CreatedAt).FirstOrDefault();
        foreach (var page in pages.OfType<JsonObject>())
        {
            var input = page.ToDictionary(pair => pair.Key, pair => FromJson(pair.Value));
            if (author is not null)
            {
                input["author"] = author.Id.ToString();
            }

            var created = await runtime.CreateAsync("Page", input).ConfigureAwait(false);
            await runtime.RunActionAsync("Page", "publish", created.Id, new Dictionary<string, object?>()).ConfigureAwait(false);
        }
    }

    private static object? FromJson(JsonNode? node) => node switch
    {
        null => null,
        JsonValue value when value.TryGetValue<bool>(out var flag) => flag,
        JsonValue value when value.TryGetValue<long>(out var number) => number,
        JsonValue value => value.GetValue<string>(),
        _ => throw new InvalidOperationException("Unsupported content value."),
    };

    /// <summary>A tar of the content and account documents (JSON Lines) and the item images (media/).</summary>
    private static async Task BackupAsync(IServiceProvider services, string path)
    {
        if (path.Length == 0 || File.Exists(path))
        {
            throw new InvalidOperationException("Choose a new backup path.");
        }

        var client = services.GetRequiredService<CosmosClient>();
        var options = services.GetRequiredService<HsimahOptions>();
        var work = Directory.CreateTempSubdirectory("hsimah-backup-");
        try
        {
            var content = Path.Combine(work.FullName, "content.jsonl");
            await using (var stream = File.Create(content))
            {
                await CosmosBackup.ExportAsync(client.GetContainer(options.Database, options.Container), stream).ConfigureAwait(false);
            }

            var accounts = Path.Combine(work.FullName, "auth.jsonl");
            await using (var stream = File.Create(accounts))
            {
                await using var writer = new StreamWriter(stream, new UTF8Encoding(false));
                using var iterator = client.GetContainer(options.Database, options.AuthContainer).GetItemQueryIterator<JsonObject>("SELECT * FROM c WHERE c.kind = 'credential'");
                while (iterator.HasMoreResults)
                {
                    foreach (var row in await iterator.ReadNextAsync().ConfigureAwait(false))
                    {
                        foreach (var system in row.Select(pair => pair.Key).Where(key => key.StartsWith('_')).ToList())
                        {
                            row.Remove(system);
                        }

                        await writer.WriteLineAsync(row.ToJsonString()).ConfigureAwait(false);
                    }
                }
            }

            var archive = Path.Combine(work.FullName, "backup.tar");
            await using (var tar = new TarWriter(File.Create(archive)))
            {
                await tar.WriteEntryAsync(content, "content.jsonl").ConfigureAwait(false);
                await tar.WriteEntryAsync(accounts, "auth.jsonl").ConfigureAwait(false);
                var assets = services.GetRequiredService<IAssetStore>();
                foreach (var name in await assets.ListAsync(CancellationToken.None).ConfigureAwait(false))
                {
                    var file = Path.Combine(work.FullName, "asset-" + name);
                    await using (var asset = await assets.OpenAsync(name, CancellationToken.None).ConfigureAwait(false) ?? throw new InvalidOperationException($"{name} vanished during the backup."))
                    await using (var target = File.Create(file))
                    {
                        await asset.Content.CopyToAsync(target).ConfigureAwait(false);
                    }

                    await tar.WriteEntryAsync(file, "media/" + name).ConfigureAwait(false);
                }
            }

            File.Move(archive, path);
            File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite);
        }
        finally
        {
            work.Delete(true);
        }
    }

    /// <summary>Validates the archive, then replaces the content, the accounts and the images with its contents.</summary>
    private static async Task RestoreAsync(IServiceProvider services, string path)
    {
        if (!File.Exists(path))
        {
            throw new InvalidOperationException("Choose an existing backup.");
        }

        var client = services.GetRequiredService<CosmosClient>();
        var options = services.GetRequiredService<HsimahOptions>();
        var work = Directory.CreateTempSubdirectory("hsimah-restore-");
        try
        {
            await using (var stream = File.OpenRead(path))
            {
                await TarFile.ExtractToDirectoryAsync(stream, work.FullName, false).ConfigureAwait(false);
            }

            var content = Path.Combine(work.FullName, "content.jsonl");
            var accounts = Path.Combine(work.FullName, "auth.jsonl");
            if (!File.Exists(content) || !File.Exists(accounts))
            {
                throw new InvalidOperationException("That is not a site backup.");
            }

            foreach (var line in File.ReadLines(content).Concat(File.ReadLines(accounts)).Where(line => line.Length > 0))
            {
                if (JsonNode.Parse(line) is not JsonObject)
                {
                    throw new InvalidOperationException("The backup is damaged.");
                }
            }

            var database = client.GetDatabase(options.Database);
            foreach (var name in new[] { options.Container, options.AuthContainer })
            {
                try
                {
                    await database.GetContainer(name).DeleteContainerAsync().ConfigureAwait(false);
                }
                catch (CosmosException error) when (error.StatusCode == HttpStatusCode.NotFound)
                {
                }
            }

            await InstallAsync(services).ConfigureAwait(false);
            await using (var stream = File.OpenRead(content))
            {
                await CosmosBackup.ImportAsync(database.GetContainer(options.Container), stream).ConfigureAwait(false);
            }

            var auth = database.GetContainer(options.AuthContainer);
            foreach (var line in File.ReadLines(accounts).Where(line => line.Length > 0))
            {
                await auth.UpsertItemAsync(JsonNode.Parse(line)!.AsObject(), new PartitionKey("auth")).ConfigureAwait(false);
            }

            var assets = services.GetRequiredService<IAssetStore>();
            foreach (var name in await assets.ListAsync(CancellationToken.None).ConfigureAwait(false))
            {
                await assets.DeleteAsync(name, CancellationToken.None).ConfigureAwait(false);
            }

            var media = Path.Combine(work.FullName, "media");
            if (Directory.Exists(media))
            {
                foreach (var file in Directory.GetFiles(media))
                {
                    var name = Path.GetFileName(file);
                    if (!ImageAssets.IsAssetName(name))
                    {
                        throw new InvalidOperationException($"The backup holds a file that is not an image asset: {name}.");
                    }

                    await assets.PutAsync(name, ImageProcessor.ContentTypeFor(name[(name.LastIndexOf('.') + 1)..])!, await File.ReadAllBytesAsync(file).ConfigureAwait(false), CancellationToken.None).ConfigureAwait(false);
                }
            }
        }
        finally
        {
            work.Delete(true);
        }
    }

    private static async Task SetActiveAsync(IServiceProvider services, string? value)
    {
        if (value is not ("true" or "false"))
        {
            throw new InvalidOperationException("Expected true or false.");
        }

        var runtime = services.GetRequiredService<Elephentity.Runtime.Gateway.Runtime>();
        foreach (var user in (await runtime.All("User").AllAsync().ConfigureAwait(false)).OfType<User>())
        {
            await runtime.UpdateAsync("User", user.Id, new Dictionary<string, object?> { ["active"] = value == "true" }).ConfigureAwait(false);
        }
    }
}
