# Architecture and generation boundaries

## Backend

Use the Elephentity PHP generator, SQLite runtime/builder and standalone GraphQL
runtime/builder. Match compiler/orchestrator/builders on protocol 1 and IR 1.2;
pin a verified compatible release set in lockfiles during implementation. The
standalone integrations are experimental, so a passing pipeline is a prerequisite,
not something inferred from README examples.

Planned `eleph.json` targets (not executed in this PR):

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
Use policy-aware EntityGateway operations rather than raw storage in API handlers.
BySlug handlers must preserve read policy evaluation and exact unique matching.
Collection ordering and bounded pagination belong in the API adapter; default 20,
maximum 100. Relay Node/PageInfo and identifier adaptation are explicitly wired.

Do not expose User through the generic GraphQL manifest. Safe application-owned
User admin fields: id, email, displayName, role, active, createdAt, updatedAt,
restricted to admins. `viewer` returns id, displayName, role to the authenticated
user. Credentials never occur in generated model fields or Relay query artifacts.
Any future public author projection needs an explicit allowlist.

## Shared behavior

Content contributes title, unique slug, Markdown content and excerpt to Page,
Post and Product. Publishable contributes status, publishedAt, actions and shared
read/write policy contracts. Timestamps contributes runtime-managed times to all
four entities. Publication verifier/action implementations can share application
helpers while implementing every generated interface. Spec patterns are sealed;
do not duplicate or override their members in an entity.

`ContentVisibility` permits published rows to anonymous viewers and all rows to
active staff. `ContentStaff` permits editor/admin create, update and publish actions;
only admin may delete. User policies check active status and role from trusted
server state. Deny is the fallback. Admin/account mutations preserve at least one
active admin transactionally, including simultaneous demotion/deactivation.

Authentication uses secure HttpOnly SameSite cookies, CSRF protection on writes,
login rate limiting, generic login failures and session rotation. Use standard
PHP password hashing/verification in the separate credential store. Never trust
client role flags. Logout and deactivation revoke sessions. Deployment uses TLS;
keep SQLite, credentials, backups and secrets outside public web roots.

Updates, publish/unpublish and content deletion carry an expected concurrency
token. Compare it inside the same serialized SQLite write transaction as the
mutation; a mismatch returns a typed conflict without applying changes. Do not
implement a check-before-write outside the transaction. `updatedAt` is not a
reliable version counter. The desired portable upstream contract is tracked in
upstream.md; if unavailable, a reviewed application transaction/version adapter
must prove this behavior before shipping edit forms.

The SQLite builder creates initial schemas only. Installation is an explicit
operator command. Keep reviewed migrations and backup/restore procedures in the
application; never rerun the initial installer on a populated database. No
existing data is present in this repo, so initial import is not required.

## Frontend

Use Tsquid's route catalogue, URI builders, route contexts, Relay entrypoints,
Astryx and StyleX. The spec route catalogue is intended to become the client
`routes.json` once entrypoints exist. Do not run its generator in this spec PR.

Tsquid currently generates routes only. Proposed content UI generation consumes
an explicit normalized metadata manifest plus ui/admin.yml and GraphQL schema,
not PHP or application TypeScript. See the upstream issue for the implementation
contract. Generated views/forms own field rendering and mechanical mutation
binding; application modules own auth, business rules and page design.

The starter is a client Vite app and does not establish SEO HTML rendering. Before
launch, test an initial-HTML rendering path compatible with its entrypoints. Prefer
an existing supported SSR/prerender mechanism; raise a concrete Tsquid issue if the
compatibility spike finds a gap. Do not assume a working SSR adapter exists.

## Implementation sequence after specification approval

1. Resolve framework compatibility and UI generation blockers; validate specs
   with installed SQLite/GraphQL builders before generating application artifacts.
2. Wire backend, initial installer, authentication and policy/verification tests.
3. Generate Tsquid routes and admin UI; add guarded screens and Relay operations.
4. Add public design, safe Markdown rendering and verified initial HTML rendering.
5. Add owner-provided content; verify acceptance, migration and restore procedures.

Any newly demonstrated framework gap gets an upstream issue with evidence,
impact, a concrete proposed solution, compatibility implications and acceptance
checks. Link existing issues rather than filing duplicates. Do not silently fork
a generator or hand-maintain its missing output inside this application.
