# Architecture and generation boundaries

## Backend

The backend uses the Elephentity PHP generator, SQLite runtime/builder and standalone
GraphQL runtime/builder with a verified compatible release set on protocol 1 and
IR 1.2, pinned in implementation lockfiles. The standalone integrations are experimental, so a passing pipeline is a prerequisite,
not something inferred from README examples.

The implementation uses these `eleph.json` targets:

```json
{
  "spec": "spec",
  "targets": {
    "php": {
      "builder": "vendor/bin/eleph-gen-php",
      "output": "generated",
      "namespace": "Hsimah\\Entity",
      "typeNamespace": "Hsimah\\Type"
    },
    "sqlite": {
      "builder": "vendor/bin/eleph-gen-sqlite",
      "output": "generated/sqlite"
    },
    "graphql-php": {
      "builder": "vendor/bin/eleph-gen-graphql-php",
      "output": "generated/graphql"
    }
  }
}
```

Application-owned code supplies dependency wiring, Viewer construction, HTTP
transport, authentication, policies, verifiers, publication actions, bySlug query
handlers, safe User DTOs and schema assembly. Generated files remain machine-owned.
API handlers use policy-aware EntityGateway operations. BySlug handlers preserve
read policy evaluation and exact unique matching.
Collection ordering and bounded pagination belong in the API adapter; default 20,
maximum 100. Relay Node/PageInfo and identifier adaptation are explicitly wired. Schema assembly
omits the automatic databaseId field to retain the specified content allowlist.

User is excluded from the generic GraphQL manifest. Safe application-owned
User admin fields: id, username, displayName, restricted to admins. `viewer` returns id, displayName, role to the authenticated
user. Credentials never occur in generated model fields or Relay query artifacts.
The public author projection, `Post.author`, is an explicit allowlist of
displayName, read from trusted storage for the single account.

## Shared behavior

Content contributes title, unique slug, Markdown content and excerpt to Page,
Post and Product. Publishable contributes status, publishedAt, actions and shared
read/write policy contracts. Timestamps contributes runtime-managed times to all
four entities. Publication verifier/action implementations can share application
helpers while implementing every generated interface. Spec patterns are sealed.

`ContentVisibility` permits published rows to anonymous viewers and all rows to
active staff. `ContentStaff` permits editor/admin create, update and publish actions;
only admin may delete. User policies check active status and role from trusted
server state. Deny is the fallback. V1 has one operator-provisioned admin; the
account UI edits only displayName and changes the password. Role changes, deactivation, additional
accounts and a last-admin invariant are outside v1. The account write policy
authorizes the caller; it is not a transactional cross-account invariant.

Authentication uses secure HttpOnly SameSite cookies, CSRF protection on writes,
login rate limiting, generic login failures and session rotation. Standard PHP
password hashing/verification operates in the separate credential store. Trusted
server state supplies roles; logout revokes sessions. Deployment uses TLS, with
SQLite, credentials, backups and secrets outside public web roots.

V1 has one content editor and does not require concurrency tokens or stale-write
conflict detection. Overlapping saves from multiple tabs can overwrite earlier
changes; that limitation is accepted for this small site. Portable conditional
updates remain a future enhancement in Elephentity #100, not an admin-form blocker.

The SQLite builder creates initial schemas only. Installation is an explicit
operator command for empty databases. Reviewed application migrations and
backup/restore procedures handle populated databases. No existing data is present in this repo, so initial import is not required.

## Frontend

The frontend uses Tsquid's route catalogue, URI builders, route contexts, Relay
entrypoints, Astryx and StyleX. The spec route catalogue becomes the client
`routes.json` once entrypoints exist. Routes share one entrypoint per entity: public
Post list/detail use post/Post.entrypoint.ts; each admin content entity groups
list/create/detail/edit under admin-page, admin-post or admin-product. Login, Home,
Page, Admin and the operator profile each have their own module: 22 routes across
10 entrypoints. Each route names one Relay query whose variables come only from its
URL (`query` in routes.json): list, create and detail routes of one entity use
separate queries, and the entrypoint preloads the query for the current route. Component directories are lowercase kebab-case and module names
start with the directory's PascalCase entity name.

Tsquid 0.3.0 generates routes, URL query-variable helpers and entrypoint parameter unions. Entrypoints use those generated helpers directly; application route adapters and duplicate query-variable functions are removed. Schema and persisted-query checks, Relay persistence, the GraphQL network transport and promise-based mutations use Tsquid utilities. Application code supplies CSRF headers and selects entity operations. Astryx links route and preload through Tsquid’s link provider. Proposed content UI generation consumes
an explicit normalized metadata manifest plus ui/admin.yml and GraphQL schema,
not PHP or application TypeScript. The upstream issue defines its implementation
contract. The proposed generator will own field rendering and mechanical mutation binding.
Until that upstream capability exists, shared application components own the forms;
they are not generated output. Application modules own authentication, business rules
and page design.

V1 remains a client Vite/Relay app for public content and administration, with
initial-data hydration. Relay persists operations to `client/persisted_queries.json`;
`tsquid-codegen` resolves each route's query into `routes.manifest.json`; the
`tsquid` Elephentity target (elephentity/codegen-tsquid) compiles that manifest into
`generated/tsquid/tsquid-manifest.php`. For HTML requests the PHP router matches the
URL, executes the route query through the same GraphQL endpoint, viewer, policies and
error formatting as `POST /graphql`, and inlines the response as `#tsquid-data` with
`Cache-Control: private, no-store`. The client's Relay network answers the matching
first request from it with `withInitialData`. Failures serve the plain shell and the
client fetches as before. HTML rendering (SSR/prerender) and initial-HTML SEO remain
deferred.

## Implementation sequence after specification approval

1. Resolve framework compatibility and UI generation blockers; validate specs
   with installed SQLite/GraphQL builders before generating application artifacts.
2. Wire backend, initial installer, authentication and policy/verification tests.
3. Generate Tsquid routes and admin UI; add guarded screens and Relay operations.
4. Add public design, safe Markdown rendering and client-updated metadata.
5. Add owner-provided content; verify acceptance, migration and restore procedures.
