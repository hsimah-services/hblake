# Consulting website

The site for hbla.ke: a standalone ASP.NET Core (C#) content backend on Elephentity.NET and Azure Cosmos DB, built from the [Elephentity specifications](spec/README.md), with a React client using tsquid routes, Relay, Astryx and StyleX. The public site uses owner-provided copy, four coloured navigation blocks and a latest-news feature. Pages and the items they hold (articles, products, framework entries) start as drafts; a single operator account manages them through `/admin`.

## Verify and run locally

The host needs bash, Python 3 and Podman or Docker. The .NET SDK, the Elephentity compiler's builders, Node, Playwright and the Cosmos DB emulator run in containers (`scripts/dotnet`, `scripts/eleph`, `scripts/node`, `scripts/tests-dotnet`). NuGet and the `eleph` release are cached outside the repository.

```sh
scripts/acceptance/gates
export ADMIN_USERNAME=operator
export ADMIN_DISPLAY_NAME='Site Operator'
read -rs ADMIN_PASSWORD; export ADMIN_PASSWORD
scripts/acceptance/up
# Open http://localhost:8080/admin/login
scripts/acceptance/down
```

`up` starts a Cosmos DB emulator (`mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator`, about 3 GB, a minute to start) and the published server on one Podman network, creates a **fresh database** and runs the installer and the bootstrap. `down` discards the database, the uploaded images and the emulator: these are development/acceptance commands, not production start/stop procedures. The acceptance stack uses the database `hsimah-acceptance` and `.var/acceptance/media`; nothing else is touched. Set `BASE_URL` to choose the local origin/port. Use a password of at least 12 characters. Never put operator credentials in the repository or command history.

Run the verification:

```sh
tests/run.sh
# Individual stages:
tests/run.sh gates
tests/run.sh playwright
tests/run.sh ops
TEST_ARGS="-class Hsimah.Acceptance.Http.AuthTests" tests/run.sh playwright
```

`tests/run.sh` is the definition of done. The gates validate the model with the live builders, generated artifact drift and contract conformance, the C# build and formatting, the server unit tests (`src/Hsimah.Server.Tests`, on the in-memory driver), tsquid routes, Relay artifacts, ESLint/architecture, TypeScript and the production build. The tests in `tests/` are xUnit v3 with Playwright for .NET: `tests/Hsimah.Acceptance` for the repository, HTTP, GraphQL and browser contracts, and `tests/Hsimah.Acceptance.Ops` for the operator procedures.

GitHub Actions runs the same `tests/run.sh` on pushes and pull requests, and uploads the failure screenshots when a run fails.

## Generation and implementation boundaries

`spec/` is the model source; `eleph.json` configures the C#, Cosmos DB, GraphQL and tsquid builders. `scripts/eleph` downloads the pinned `eleph` release; `scripts/eleph install` fetches the pinned builders into `tools/builders/`. `src/Hsimah.Server/Generated/`, `client/persisted_queries.json`, `client/src/routes/__generated__/` and Relay `__generated__/` directories are machine-owned. Regenerate in dependency order: `scripts/node relay` (persisted queries), `scripts/node routes` (routes and `routes.manifest.json`), then `scripts/eleph generate`. Never edit the generated output; where the generators fall short, the application adapts around them (see `src/Hsimah.Server/Storage.cs`, `ApplicationGateway.cs`, `HsimahExecutor.cs` and `HsimahSchema.cs`) and [spec/upstream.md](spec/upstream.md) records the gap. `client/schema.graphql` matches the server's schema: `Http/SchemaTests` compares their types, fields, arguments and enum values, and `Hsimah.Server console schema` prints the server's schema as SDL.

tsquid 0.3.0 generates routes, route-query variable helpers and entrypoint parameter unions. Its schema/persisted-query CLIs and network/mutation helpers replace the former local utilities. The ESLint plugin is 0.2.0; the Vite plugin remains at its latest release, 0.1.1. Astryx links use tsquid preloading through the application link provider. Content screens remain application-owned. The application shares its form, preview and detail behavior explicitly; it does not label these screens generated. [tsquid #7](https://github.com/hsimah-services/tsquid/issues/7) tracks the metadata-driven admin generator.

The toolchain uses `eleph` 0.16.1 with coordinator `eleph-codegen` 0.7.0, the C# and GraphQL builders `eleph-gen-csharp` and `eleph-gen-graphql-csharp` 0.1.0-alpha.1, the Cosmos builder `eleph-gen-cosmos` 0.1.0-alpha.1 and the tsquid builder 0.2.0, with the NuGet packages `Elephentity.Runtime`, `.Cosmos`, `.GraphQL`, `.Tsquid` and `.Runtime.Memory` at 0.1.0-alpha.2. All are pinned releases, with no project references or custom NuGet sources. See [upstream findings](spec/upstream.md) for the framework gaps this port found.

## Operator data procedures

Content and the account live in an Azure Cosmos DB account (one database, two containers: `hsimah` for the Elephentity documents and `hsimah-auth` for credentials, sessions and login failures). Configuration is by environment:

| Variable | Default | |
| --- | --- | --- |
| `HSIMAH_COSMOS_ENDPOINT` | `https://localhost:8081` | the account endpoint |
| `HSIMAH_COSMOS_KEY` | the emulator's key | the account key; never commit a real one |
| `HSIMAH_COSMOS_DATABASE` | `hsimah` | |
| `HSIMAH_COSMOS_CONTAINER`, `HSIMAH_COSMOS_AUTH_CONTAINER` | `hsimah`, `hsimah-auth` | |
| `HSIMAH_COSMOS_ALLOW_ANY_CERTIFICATE` | `false` | `true` only for the emulator's self-signed certificate |
| `HSIMAH_PASSWORD_COST` | `12` | bcrypt cost for new passwords (4 to 31; each step doubles the work). The acceptance stack uses 10 |
| `HSIMAH_ASSET_STORE` | `filesystem` | where item images are stored: `filesystem` or `blob` (Azure Blob Storage) |
| `HSIMAH_BLOB_ENDPOINT` | | the storage account's blob endpoint (`https://<account>.blob.core.windows.net`); the server signs in with its managed identity, which needs the *Storage Blob Data Contributor* role on the container |
| `HSIMAH_BLOB_CONNECTION_STRING` | | a connection string instead of the endpoint, for Azurite in development and tests |
| `HSIMAH_BLOB_CONTAINER` | `media` | the private container (created on first use) |
| `HSIMAH_MEDIA` | `.var/media` | the directory for the `filesystem` store; keep it private and back it up |
| `HSIMAH_CLIENT`, `HSIMAH_CONTENT` | the repository's built client and launch content | |

The server serves the built client, `/graphql`, `/auth/*`, `/media/*` and every HTML request (so route data can be inlined) itself; nothing else on disk is reachable. Use HTTPS, give the media directory mode 0700, and run the server behind a TLS proxy only after configuring trusted-proxy address handling: login throttling uses the connection's remote address, so clients behind one proxy would share a failure bucket. Session cookies use Secure for HTTPS and all public hosts; plain HTTP loopback requests are the only exception. Backups include credential hashes; protect them as private data. No production deployment is configured here.

Publish the server with `dotnet publish src/Hsimah.Server -c Release` and run it with the .NET 10 ASP.NET Core runtime. The operator commands are the same binary:

```sh
dotnet Hsimah.Server.dll console install
dotnet Hsimah.Server.dll console bootstrap
```

`install` creates the database and containers and refuses a populated content container. Bootstrap reads `ADMIN_USERNAME`, `ADMIN_DISPLAY_NAME` (the author name shown on pages and items) and `ADMIN_PASSWORD` (at least 12 characters), and refuses to create a second account. The account has no email; change its password from Settings in the admin. The application exposes only the operator's allowlisted profile fields, never generic user lifecycle operations or credentials. `console expire-sessions` and `console set-active true|false` are for acceptance testing and future operator workflows.

```sh
dotnet Hsimah.Server.dll console backup /private/path/site-backup.tar
dotnet Hsimah.Server.dll console restore /private/path/site-backup.tar
```

A backup is a tar of the content documents and the account credentials (JSON Lines) and the item images (`media/`, read from whichever asset store is configured). Restore validates the archive, then recreates both containers, imports it and replaces the images. Cosmos DB also takes periodic backups of the account itself; use those for recovery and this procedure for moving data. Unique keys and composite indexes cannot be changed on an existing container, so a model change that alters them ships as: back up, install into a new container, restore.

V1 is client-rendered; each route's HTML carries its query response as tsquid initial data (`#tsquid-data`), executed as the requesting viewer. Initial-HTML SEO, concurrent edit protection, additional accounts and commerce are deferred, as recorded in the specification. The site name is hblake; launch copy and public contact links are supplied by the owner. Deployment remains a separate operator action.

## Image assets

Item images are an Elephentity-style building block, kept apart from the site so other products can reuse it:

- The `HasImageAsset` pattern (`spec/patterns/HasImageAsset.yml`) gives an entity an optional `imageUrl` and `imageAlt`, both verified: the URL must be an asset this application stored, and alt text must accompany an image.
- `src/Hsimah.Assets` holds the behaviour. `ImageProcessor` accepts PNG, JPEG and WebP by content, bounds the size and pixels, turns JPEGs upright and re-encodes (which drops EXIF and location data). `ImageAssets` names the result at random, stores it, and serves `/media/<name>` with long cache headers. `IAssetStore` is the pluggable part, with `FileSystemAssetStore` and `AzureBlobAssetStore` (a private container, never public URLs; the server streams images).
- The acceptance stack stores images in Azurite, so the Blob path is what the tests and the backup/restore round trip exercise.

## Launch content

`content/pages.json` contains the owner-approved Home, About, Portfolio
and Contact us copy. After installation, replace all Page and PageItem content
with these six published pages (the four launch pages plus the News and Products pages, which hold items):

```sh
dotnet Hsimah.Server.dll console replace-content
```

This command is destructive to existing content and is not atomic (Cosmos DB batches are limited to 100 operations), so take a backup first. Accounts,
credentials and sessions are preserved. It is explicit and never runs during
acceptance startup, which requires an empty content database. Subsequent edits can
be made through the admin screens. The homepage displays the latest published
News item when available and omits that section while there is none. The News and Products
pages carry placeholder copy of two words each; replace it with the owner's wording.
