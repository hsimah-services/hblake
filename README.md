# Consulting website

A standalone PHP/SQLite content backend built from the [Elephentity specifications](spec/README.md), with a React client using Tsquid routes, Relay, Astryx and StyleX. The initial site has no fabricated business copy. Pages, posts and products start as drafts; a single operator account manages them through `/admin`.

## Verify and run locally

The host needs bash, Python 3 and Podman or Docker. PHP, Rust, Composer, Node and Playwright run in containers. The PHP image is built from `.docker/php.Dockerfile` on first use. Dependencies and Rust builds are cached outside the web root.

```sh
scripts/acceptance/gates
export ADMIN_EMAIL=operator@example.test
export ADMIN_DISPLAY_NAME='Site Operator'
read -rs ADMIN_PASSWORD; export ADMIN_PASSWORD
scripts/acceptance/up
# Open http://localhost:8080/admin/login
scripts/acceptance/down
```

`up` creates a **fresh database**, and `down` discards it: these are development/acceptance commands, not production start/stop procedures. Set `BASE_URL` to choose the local origin/port. Use a password of at least 12 characters. Never put operator credentials in the repository or command history.

Run the owner-provided verification unchanged:

```sh
tests/run.sh
# Individual stages:
tests/run.sh gates
tests/run.sh playwright
tests/run.sh ops
```

Verification currently passes all 200 Playwright checks, six operator-procedure checks and five application unit tests. The gates validate live builder metadata, generated artifact drift and accessor conformance, PHPStan at maximum level, application unit tests, Tsquid routes, Relay artifacts, ESLint/architecture, TypeScript and the production build. `tests/` remains owner-maintained; implementation tests live in `server/tests`.

GitHub Actions runs the same `tests/run.sh` on pushes and pull requests, and uploads Playwright results when a run fails.

## Generation and implementation boundaries

`spec/` is the model source; `eleph.json` configures the actual PHP, SQLite and GraphQL builders. `generated/`, `client/src/routes/__generated__/` and Relay `__generated__/` directories are machine-owned. Regenerate using `scripts/php vendor/bin/eleph generate`, `scripts/node routes` and `scripts/node relay`. Never edit the generated output. `client/schema.graphql` is exported from the assembled schema through `scripts/php php server/console.php schema`, or from a running server with `scripts/node schema`. Set `GRAPHQL_SCHEMA_ENDPOINT` to introspect another development endpoint.

Tsquid currently generates routes, rather than content screens. The application shares its form, preview and detail behavior explicitly; it does not label these screens generated. [Tsquid #7](https://github.com/hsimah-services/tsquid/issues/7) tracks the metadata-driven admin generator.

The PHP generator is temporarily pinned to [upstream PR #34](https://github.com/hsimah-services/elephentity-codegen-php/pull/34), including release 0.6.1's enum-case protection. Runtime 0.12 is installed with a Composer version alias while [CLI packaging #104](https://github.com/hsimah-services/elephentity/issues/104) is corrected. The lockfile pins the actual source; no private generator fork is kept here. [Singular query #105](https://github.com/hsimah-services/elephentity/issues/105) and [original action state #33](https://github.com/hsimah-services/elephentity-codegen-php/issues/33) have narrow application adapters in schema assembly. [Create defaults #106](https://github.com/hsimah-services/elephentity/issues/106) and [nullable verification #107](https://github.com/hsimah-services/elephentity/issues/107) are likewise handled explicitly. The GraphQL and SQLite builders are pinned to their respective upstream PR #3 type-boundary fixes, so generated files remain included in PHPStan. Remove the adapters and temporary pins when compatible releases land.

## Operator data procedures

SQLite, credentials, sessions and dependency caches live outside `server/public` and the built static client. A deployment must serve only those public roots, route `/graphql` and `/auth/*` to PHP, use HTTPS, and give the private data directory mode 0700. Backups include credential hashes and sessions; protect them as private data. No production deployment is configured here.

Initial installation is explicit and refuses existing tables:

```sh
scripts/php php server/console.php install
scripts/php php server/console.php bootstrap
```

Bootstrap refuses to create a second account. The application exposes only the operator's allowlisted profile fields, never generic user lifecycle operations or credentials. Account activation/session expiry hooks are for acceptance testing and future operator workflows.

For a running acceptance stack:

```sh
scripts/acceptance/backup /private/path/site-backup.sqlite
scripts/acceptance/restore /private/path/site-backup.sqlite
```

Backup uses SQLite `VACUUM INTO` for a consistent snapshot. Restore validates integrity, stops the server, replaces the database and restarts before returning. Run the equivalent procedure under maintenance mode in production. Do not rerun the initial installer as an upgrade; future schema changes require a reviewed migration and a tested backup/restore.

V1 is client-rendered. Initial-HTML SEO, concurrent edit protection, additional accounts and commerce are deferred, as recorded in the specification. Owner-provided branding, content and contact details are still required before a public launch.
