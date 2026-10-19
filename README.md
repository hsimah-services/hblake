# Consulting website

The site for hbla.ke: a standalone PHP/SQLite content backend built from the [Elephentity specifications](spec/README.md), with a React client using tsquid routes, Relay, Astryx and StyleX. The public site uses owner-provided copy, four coloured navigation blocks and a latest-news feature. Pages and the items they hold (articles, products, framework entries) start as drafts; a single operator account manages them through `/admin`.

## Verify and run locally

The host needs bash, Python 3 and Podman or Docker. PHP, Rust, Composer, Node and Playwright run in containers. The PHP image is built from `.docker/php.Dockerfile` on first use. Dependencies and Rust builds are cached outside the web root.

```sh
scripts/acceptance/gates
export ADMIN_USERNAME=operator
export ADMIN_DISPLAY_NAME='Site Operator'
read -rs ADMIN_PASSWORD; export ADMIN_PASSWORD
scripts/acceptance/up
# Open http://localhost:8080/admin/login
scripts/acceptance/down
```

`up` creates a **fresh database**, and `down` discards it: these are development/acceptance commands, not production start/stop procedures. The acceptance stack's database is `.var/acceptance/site.sqlite`; the harness and `tests/run.sh` never touch the default local database, `.var/site.sqlite`, which the console commands and any server started without `HSIMAH_DATABASE` use. Set `BASE_URL` to choose the local origin/port. Use a password of at least 12 characters. Never put operator credentials in the repository or command history.

Run the owner-provided verification unchanged:

```sh
tests/run.sh
# Individual stages:
tests/run.sh gates
tests/run.sh playwright
tests/run.sh ops
```

`tests/run.sh` passes. The gates validate live builder metadata, generated artifact drift and accessor conformance, PHPStan at maximum level, application unit tests, tsquid routes, Relay artifacts, ESLint/architecture, TypeScript and the production build. `tests/` remains owner-maintained; implementation tests live in `server/tests`.

GitHub Actions runs the same `tests/run.sh` on pushes and pull requests, and uploads Playwright results when a run fails.

## Generation and implementation boundaries

`spec/` is the model source; `eleph.json` configures the actual PHP, SQLite, GraphQL and tsquid builders. `generated/`, `client/persisted_queries.json`, `client/src/routes/__generated__/` and Relay `__generated__/` directories are machine-owned. Regenerate in dependency order: `scripts/node relay` (persisted queries), `scripts/node routes` (routes and `routes.manifest.json`), then `scripts/php vendor/bin/eleph generate` (which compiles the route manifest into `generated/tsquid/`). Never edit the generated output. `client/schema.graphql` uses server order as canonical: export it with `HSIMAH_DATABASE=:memory: scripts/php php server/console.php schema > client/schema.graphql`. `scripts/node schema` provides live introspection in sorted SDL order; checks normalize both representations. Re-export with the operator command before committing the schema. Set `GRAPHQL_SCHEMA_ENDPOINT` to introspect another development endpoint. `scripts/node schema:check` compares the exported server schema; `scripts/node relay:check` checks persisted operation IDs.

tsquid 0.3.0 generates routes, route-query variable helpers and entrypoint parameter unions. Its schema/persisted-query CLIs and network/mutation helpers replace the former local utilities. The ESLint plugin is 0.2.0; the Vite plugin remains at its latest release, 0.1.1. Astryx links use tsquid preloading through the application link provider. Content screens remain application-owned. The application shares its form, preview and detail behavior explicitly; it does not label these screens generated. [tsquid #7](https://github.com/hsimah-services/tsquid/issues/7) tracks the metadata-driven admin generator.

The toolchain uses released Elephentity runtime/CLI 0.13.1, coordinator 0.6.1, PHP builder 0.7.0, SQLite runtime 0.1.0-alpha.5, GraphQL runtime 0.2.0-alpha.1 and integration builders 0.1.0-alpha.3. Composer locks tagged releases, with no branch pins, aliases or custom repositories. These releases include the upstream enum decoder and generated PHPStan fixes, scalar query support, create defaults, final-state nullable validation and read-only action context. Publication actions now read original state directly; the former schema adapters are removed. The schema gate exports the server schema and compares normalized SDL against `client/schema.graphql` before Relay validation. See [upstream findings](spec/upstream.md) for release evidence and remaining framework gaps.

## Operator data procedures

SQLite, credentials, sessions and dependency caches live outside `server/public` and the built static client. A deployment must serve only those public roots, route `/graphql`, `/auth/*` and every HTML (non-asset) request to PHP so route data can be inlined, use HTTPS, and give the private data directory mode 0700. Item images live in `media/` beside the database (override with `HSIMAH_MEDIA`) and are served by PHP from `/media/`, so route `/media/*` to PHP too. PHP needs the GD extension with JPEG and WebP support, `upload_max_filesize` of at least 6M and `post_max_size` of at least 8M; `.docker/php.Dockerfile` (image `localhost/hsimah-php:2`) sets these up. Backups include credential hashes and sessions; protect them as private data. Session cookies use Secure for HTTPS and all public hosts; plain HTTP loopback requests are the only exception. Login throttling uses REMOTE_ADDR: configure trusted-proxy address handling before deploying behind a reverse proxy so clients do not share one failure bucket. No production deployment is configured here.

Initial installation is explicit and refuses existing tables:

```sh
scripts/php php server/console.php install
scripts/php php server/console.php bootstrap
```

Bootstrap reads `ADMIN_USERNAME`, `ADMIN_DISPLAY_NAME` (the author name shown on pages and items) and `ADMIN_PASSWORD` (at least 12 characters), and refuses to create a second account. The account has no email; change its password from Settings in the admin. The application exposes only the operator's allowlisted profile fields, never generic user lifecycle operations or credentials. Account activation/session expiry hooks are for acceptance testing and future operator workflows.

For a running acceptance stack:

```sh
scripts/acceptance/backup /private/path/site-backup.tar
scripts/acceptance/restore /private/path/site-backup.tar
```

A backup is a tar of a `VACUUM INTO` database snapshot (`site.sqlite`) and the item images (`media/`). Restore validates the archive and the database's integrity before stopping the server, then replaces the database and images and restarts before returning. Run the equivalent procedure under maintenance mode in production. Do not rerun the initial installer as an upgrade. Schema changes ship as reviewed migrations in `server/src/Migrations.php` (tested in `server/tests/MigrationsTest.php`); after deploying a release, take a backup and then apply them:

```sh
scripts/php php server/console.php upgrade
```

Each migration runs once in a transaction and is recorded in `schema_migration`; a fresh install records them all as applied. If an upgrade misbehaves, restore the backup taken before it.

V1 is client-rendered; each route's HTML carries its query response as tsquid initial data (`#tsquid-data`), executed as the requesting viewer. Initial-HTML SEO, concurrent edit protection, additional accounts and commerce are deferred, as recorded in the specification. The site name is hblake; launch copy and public contact links are supplied by the owner. Deployment remains a separate operator action.

## Launch content

`content/pages.json` contains the owner-approved Home, About, Frameworks, Portfolio
and Contact us copy. After installation, replace all Page and PageItem content
with these seven published pages (the five launch pages plus the empty News and Products pages, which hold items):

```sh
scripts/php php server/console.php replace-content
```

This command is destructive to existing content and runs atomically. Accounts,
credentials and sessions are preserved. It is explicit and never runs during
acceptance startup, which requires an empty content database. Subsequent edits can
be made through the admin screens. The homepage displays the latest published
News item when available and omits that section while there is none. The News and Products
pages carry placeholder copy of two words each; replace it with the owner's wording.
