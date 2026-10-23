# Upstream capabilities and gaps

## Reviewed source revisions

Documentation and source were inspected at these commits on 2026-10-10:

| Component | Commit |
| --- | --- |
| Elephentity | `58a37e37b3fcab5338f9159c9e349703d4fc41be` |
| tsquid | `82c27cdc6bc23ad004519f0b65a2c99738d50113` |
| Standalone GraphQL builder | `cc56d57e6ea6ed8edeaf0e4cdbd01195e8857ea9` |
| Standalone GraphQL runtime | `558719cdfe5dffa07c86e90dc53b97f9105a842c` |
| SQLite builder | `95681fb7dbf081b39e4f75953aa47aa5ff3a541b` |

## Confirmed enhancements filed for this project

| Gap | Issue | V1 decision / resolution |
| --- | --- | --- |
| tsquid generates routes, not admin views/forms | [tsquid #7](https://github.com/hsimah-services/tsquid/issues/7) | Separate metadata-driven generator for explicit list/detail/create/edit allowlists, Astryx widgets, Relay bindings, validation and deterministic checks |
| Gateway/storage has no expected-version mutation contract | [elephentity #100](https://github.com/hsimah-services/elephentity/issues/100) | Deferred: the single-editor v1 has no conflict detection; future support uses opaque versions and atomic conditional mutations |
| Policy-filtered paging and counts | [elephentity #102](https://github.com/hsimah-services/elephentity/issues/102) | Accepted for the small v1 dataset; upstream keyset paging resumes after the last visible row |
| Publication fields appear in generic client inputs | [elephentity #103](https://github.com/hsimah-services/elephentity/issues/103) | Accepted framework limitation; explicit action-aware verifiers protect v1, future write visibility removes these fields from generic inputs |

The reports include evidence, concrete solutions, acceptance checks and compatibility
implications. Admin generation remains a blocker for claiming generated forms.

**Admin revamp decision (hblake #15):** the WordPress-style admin stays hand-built for
now rather than waiting for tsquid #7. It is the reference the generator should be able
to reproduce, and feeds these requirements into #7: an AppShell with a content-type
sidebar and per-type counts; list tables with the admin.yml columns, sortable headers,
status and title filters in the URL, and per-row edit, publish/unpublish and delete with
an accessible confirmation; a two-column edit form with a publishing side panel; a
dashboard with per-status counts and recently edited records; relative timestamps with
an accessible absolute time. Filtering and sorting are client-side over the loaded page
until the list queries accept status, search and order arguments.
Neither concurrency support nor improved paging blocks v1. Publication fields stay
in generated inputs until #103; v1 verifiers require draft/null on create and the
appropriate declared action for field changes. No unsupported write-visibility key
is added to this model. Single-account operation removes the need for a last-admin
transactional invariant and multi-account credential provisioning.

## Existing reports relevant to implementation

- [Elephentity #94](https://github.com/hsimah-services/elephentity/issues/94)
  records UTC datetime round-trip loss, rollback identity exposure and filtered
  first() behavior. Use UTC encoding/decoding, resolve persisted IDs only after a
  successful commit, and scan bounded pages for guarded first() lookups. Verify
  fixes in the chosen release rather than assuming main/release parity.
- [Standalone GraphQL #3](https://github.com/hsimah-services/elephentity-graphql-php/issues/3)
  records wrong-type global IDs, ignored backward pagination and empty mutation
  root assembly. Validate decoded ID types against expected entities, honor or
  explicitly reject unsupported pagination, and omit an empty mutation root.
  This site uses forward pagination; wrong-type ID handling is a release blocker.
- [GraphQL builder #1](https://github.com/hsimah-services/elephentity-codegen-graphql-php/issues/1)
  records generated GraphQL type-name collisions. Reserve all automatic names
  before emission and validate the real assembled schema for this model.
- [Elephentity #1](https://github.com/hsimah-services/elephentity/issues/1)
  requests field visibility. Current entity-level read/write policies exist, but
  per-field API exposure is not expressed by the reviewed schema. This model avoids
  exposing User wholesale; private User DTO operations supply explicit allowlists.
  No additional field-visibility issue is filed.

These existing reports already contain detailed fixes; duplicates are unnecessary.
They are implementation prerequisites where the selected release still reproduces
the finding, not new bugs proven by running this specification-only change.

## Validation without generation

[Elephentity PR #101](https://github.com/hsimah-services/elephentity/pull/101) is
merged. It adds `--provides <saved-describe-json>` to run the compiler with explicit
snapshot metadata and no builder execution or eleph.json.

The temporary provides snapshot has been removed. The implementation supplies
eleph.json and real builders and uses live `eleph validate spec`.

Using the merged change's CLI, the actual command passed without generating files:

```text
eleph validate spec --provides spec/provides.json
Specs are valid: 4 entities, 2 types.
```

The upstream FormatChecker also passed canonical formatting. Independent JSON
Schema and reference checks passed all 10 model YAML files, expanded patterns,
action writes, admin field allowlists and 22 routes grouped across 10 entrypoints.
UI descriptor checks verify internal consistency only; tsquid cannot consume admin.yml yet.

## Remaining implementation boundaries

- SSR/prerender and initial-HTML SEO are deferred beyond v1, per review. The
  public frontend remains a client-rendered tsquid app; route queries are hydrated
  from inlined initial data using tsquid 0.3.0 (including PR #8) and
  elephentity/codegen-tsquid 0.1.0.
- Cosmos DB unique keys and composite indexes cannot change on an existing container, so a
  model change that alters them is applied by backup, install into a new container and
  restore; the installer is not an upgrade engine.

## Implementation findings (the PHP/SQLite stack, kept as history)

The sections below this one, up to "Gaps found porting to Elephentity.NET", describe the stack this repository ran before it moved to
ASP.NET Core; the Elephentity.NET port is the last section.

The implementation uses tagged releases: runtime/CLI 0.13.1, coordinator 0.6.1,
PHP builder 0.7.0, SQLite runtime 0.1.0-alpha.5, GraphQL runtime 0.2.0-alpha.1,
and SQLite/GraphQL builders 0.1.0-alpha.3. composer.lock records the release commits.
No version aliases, development branches or custom VCS repositories remain.

- [CLI #104](https://github.com/hsimah-services/elephentity/issues/104) is closed:
  CLI 0.13.1 permits runtime 0.13.1 without a version alias.
- [Runtime #105](https://github.com/hsimah-services/elephentity/issues/105) is closed:
  runtime 0.13 supports scalar gateway queries; GraphQL 0.2.0-alpha.1 handles them
  directly. The scalar-finder schema adapter is removed.
- [Runtime #106](https://github.com/hsimah-services/elephentity/issues/106) is closed:
  PHP builder 0.7.0 seeds create defaults through decoders. The create adapter is removed.
- [Runtime #107](https://github.com/hsimah-services/elephentity/issues/107) is closed:
  runtime verifies final mutation state and nonnullable field presence; nullable
  verifier contracts accept null. The publication/null schema adapter is removed.
  Malformed decoder/storage exceptions are logged and return generic safe errors;
  deliberate application errors and verification violations remain useful to clients.
- [PHP builder #33](https://github.com/hsimah-services/elephentity-codegen-php/issues/33)
  is closed: PHP builder 0.7.0 exposes read-only typed action context. Publication reads
  its original timestamp directly, replacing request-scoped schema state.
- [PHP builder PR #34](https://github.com/hsimah-services/elephentity-codegen-php/pull/34)
  merged at `50182eb`, which is the v0.6.2 release commit and is included in v0.7.0.
  Declared enum hydration/input dispatches through ValueDecoder.
- [GraphQL builder PR #3](https://github.com/hsimah-services/elephentity-codegen-graphql-php/pull/3)
  merged at `716cb95`, the v0.1.0-alpha.3 release commit.
  [SQLite builder PR #3](https://github.com/hsimah-services/elephentity-codegen-sqlite/pull/3)
  merged at `7c641dc`, the v0.1.0-alpha.3 release commit. Both generated integration
  type checks remain included in PHPStan max.
- [PHP builder #35](https://github.com/hsimah-services/elephentity-codegen-php/issues/35)
  is fixed in 0.7.0: regenerated PHP no longer contains trailing whitespace.

- [Standalone GraphQL #9](https://github.com/hsimah-services/elephentity-graphql-php/issues/9):
  a published collection query with no arguments emits an empty `WhereArgs` input and
  an invalid schema. Page `placed` takes a meaningful `home` argument and `recent`
  a nullable `status`, so neither needs an argument-free query.
- [Standalone GraphQL #10](https://github.com/hsimah-services/elephentity-graphql-php/issues/10):
  published collection queries read their arguments beside the paging ones while the
  schema nests them under `where`, and enum arguments reach handlers undecoded.
  `server/src/Schema.php` unwraps `where` and decodes enum arguments for spec queries,
  and leaves the root `pages`/`posts`/`products` ordering override to plain lists.
  Remove the workaround once #10 ships.

Generated artifacts remain machine-owned. tsquid admin generation is still #7;
the application's shared forms are handwritten and are not claimed as generated.
The client now owns queries, components and mutations per entrypoint/entity, with
shared navigation supplied by a Relay fragment independent of collection cursors.

## tsquid 0.3.0 migration

Verified npm release tags on 2026-10-11: `@tsquid/routes` and `@tsquid/codegen`
0.3.0, `@tsquid/eslint-plugin` 0.2.0, and `@tsquid/vite` 0.1.1.
The published generator emits route-query variable helpers and entrypoint parameter
unions. These replace the application's handwritten URL adapters and variable
functions. tsquid's `tsquid-schema` and `tsquid-relay` commands replace local
schema fetch/normalization and persisted-query scripts. Runtime network and mutation
helpers replace the local transport and callback-to-promise wrapper, with application
CSRF headers and strict GraphQL error handling retained. A shared mutation dispatcher
invalidates cached route queries after successful writes. Astryx links use the tsquid preloading provider to satisfy
the updated lint rules. Route queries use store-or-network so hover preloads are reused during navigation;
write invalidation refreshes collection and navigation data on the next load.
Successful sign-in/sign-out invalidates the root record so route queries reload for
the current session.
Admin UI generation remains tracked in #7; these releases do not generate forms.

## Gaps found while adding PageItem (2026-10-19)

Not yet filed upstream; each needs an issue with the evidence, impact, solution and
acceptance check below before the workaround is removed.

- **Generated contract names collide across entities.** `Page.itemKind` and
  `PageItem.kind` each generate an interface named `PageItemKindVerifier`
  (`Hsimah\Entity\Page\Contract\PageItemKindVerifier` and
  `Hsimah\Entity\PageItem\Contract\PageItemKindVerifier`), and the generated
  `Wiring.php` imports both, which is a fatal "name is already in use" error at load.
  `eleph validate` and `eleph generate` both succeed, so nothing warns before runtime.
  *Impact:* a field name that, prefixed with its entity, equals another entity-prefixed
  field breaks the whole application. *Solution:* detect colliding generated names in
  `validate` (as GraphQL builder #1 asks for GraphQL type names), or alias imports in
  generated code. *Acceptance:* a spec with `Page.itemKind` and `PageItem.kind` either
  fails `eleph validate` with a clear message or loads. *Workaround:* the field is named
  `Page.defaultItemKind`.
- **Edge inputs are named after the edge, and "required" is not a GraphQL constraint.**
  `PageItem.page` (`required: true`) is `page: ID`, nullable, in `CreatePageItemInput`, so
  a create without it reaches the runtime. *Solution:* make required to-one edges
  `ID!` on create inputs. *Workaround:* `Hsimah\PageItems` rejects a missing page.
- **No generated way to set an edge from the session.** `author` (an edge to `User`,
  which is not exposed) needs the signed-in user on create. *Solution:* a spec-level
  `managed` source such as `viewer` for edges, as for timestamps. *Workaround:*
  `Hsimah\PageItems::authored` adds it to the GraphQL input before the mutation runs.
- **Edge filters read in an unexpected direction.** `EdgeFilter::along` returns the
  targets of an edge and `::back` returns the rows pointing at them; "items of a page"
  is `back('PageItem', 'page', ...)`. Worth a documented example.

## Gaps found porting to Elephentity.NET (2026-10-22)

The server moved from PHP/SQLite to ASP.NET Core on `Elephentity.*` 0.1.0-alpha.2 (builders `eleph-gen-csharp`,
`eleph-gen-cosmos`, `eleph-gen-graphql-csharp` 0.1.0-alpha.1, `eleph-gen-tsquid` 0.2.0, coordinator `eleph-codegen` 0.7.0). No
generated file was edited: every gap below is worked around in application code and listed with what the generator should do instead.
Filed upstream on 2026-10-22, with the evidence, impact, solution, compatibility and acceptance check given here (no existing
reports were found); remove each workaround when its issue ships.

1. **No SQLite storage for .NET.** ([elephentity#190](https://github.com/hsimah-services/elephentity/issues/190)) The runtime ships a memory driver and a Cosmos adaptor. `driver: sqlite` with the C# builder fails
   with "No installed builder generates for storage driver sqlite". *Impact:* a project on SQLite (the Raspberry Pi v1) cannot port.
   *Decision here:* the storage driver became `cosmos` (owner decision). *Solution:* `Elephentity.Sqlite` plus an
   `eleph-gen-sqlite` manifest for C#. *Compatibility:* additive. *Acceptance:* the adaptor passes `AdaptorConformance`.
2. **Query orderings are not part of the spec.** ([elephentity#191](https://github.com/hsimah-services/elephentity/issues/191)) `eleph-gen-cosmos` declares composite indexes only for single `indexed`/`unique`
   fields, but handler queries sort by several (`updatedAt desc, id desc`; `navigationOrder, title, id`; `publishedAt desc, id desc`).
   Cosmos rejects an `ORDER BY` without a composite index and the query fails at run time (500). *Workaround:*
   `src/Hsimah.Server/Storage.cs` adds the `CosmosOrdering` entries to the generated manifest. *Solution:* let a query declare its
   order (for example `orderBy:` on the query) and feed it to the storage builders. *Acceptance:* a spec query with a two-field order
   runs on the emulator without hand-written indexes.
3. **`maxLength` is not enforced.** ([elephentity#192](https://github.com/hsimah-services/elephentity/issues/192)) The C# builder ignores `maxLength` on string fields without `verify: true` (`Page.excerpt` 300,
   `PageItem.imageUrl` 100, `PageItem.imageAlt` 300); the PHP builder rejected an over-long value. *Impact:* oversized values are
   stored. *Workaround:* `ApplicationGateway.CheckLengths`. *Solution:* generate a field violation in the mutator. *Acceptance:* an
   over-long excerpt is rejected as in `Http/ValidationTests`.
4. **The per-query edge cache is not thread-safe.** ([elephentity#193](https://github.com/hsimah-services/elephentity/issues/193)) `CachingEdgeLoader` keeps a plain `Dictionary`, but GraphQL.NET resolves the
   fields of a list's items in parallel, so `Page.author` and `PageItem.page` across a list sporadically fail with "Operations that
   change non-concurrent collections must have exclusive access" (INTERNAL errors). *Workaround:* `HsimahExecutor` runs every
   operation with `SerialExecutionStrategy`. *Solution:* a concurrent cache, or select the serial strategy in
   `Elephentity.GraphQL`'s executor. *Acceptance:* listing 50 items with `author` and `page` never errors.
5. **No extension point for application-owned GraphQL.** ([elephentity#194](https://github.com/hsimah-services/elephentity/issues/194)) `ElephentitySchema.Build` returns a finished schema; adding `viewer`,
   `adminUser`, `updateAdminUser`, `Page.itemCount`, the public `author` projection, removing `databaseId` and preparing mutation
   input (author from the session, page checks) meant rebuilding the manifest, mutating the built schema and wrapping
   `IEntityGateway` (`HsimahSchema`, `ApplicationGateway`). *Solution:* documented hooks for extra fields, field removal and input
   preparation. *Acceptance:* `Http/SchemaTests` passes without schema mutation after build.
6. **tsquid emits C# when `language` is `csharp`.** Withdrawn: this entry first said the builder only wrote PHP, which was wrong. The target's
   `language` option (documented in the builder README, accepted by 0.2.0) selects C#. [elephentity#195](https://github.com/hsimah-services/elephentity/issues/195) is closed.
7. **Builder options are undocumented.** ([elephentity#196](https://github.com/hsimah-services/elephentity/issues/196)) The GraphQL builder needs `namespace` and `entityNamespace` in its target, and the tsquid
   `manifest` path is relative to the target's output; neither is in the builder README quickstart.
8. **`CommitRejected` messages say "The change was rejected by N violation(s)."** ([elephentity#197](https://github.com/hsimah-services/elephentity/issues/197)) The violations are in `extensions.violations`; the
   PHP stack put the first violation's text in `message`, which the UI shows. *Impact:* none for the current client, which reads
   `extensions`; noted for clients that show `message`.
9. **Operational: the Linux Cosmos DB emulator crashes** now and then under sustained load ("sqlpal.dll ... Last Chance"). The
   acceptance harness restarts a stopped emulator on `up`; rerun a failed stage after a crash.
10. **List reads cost storage round trips per row.** ([elephentity#200](https://github.com/hsimah-services/elephentity/issues/200), related to
    [#153](https://github.com/hsimah-services/elephentity/issues/153)) Edge loads and read policies that need a related row are not batched, so
    a visitor's list of 20 items took 14 s (28 s with `totalCount`, 31 s with `author` and `page`) on the Cosmos emulator. *Workaround:*
    `ContentVisibility` decides which items are hidden once per request (0.27 s, 0.55 s, 6 s); the per-row `author`/`page` loads remain.
