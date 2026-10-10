# Upstream capabilities and gaps

## Reviewed source revisions

Documentation and source were inspected at these commits on 2026-10-10:

| Component | Commit |
| --- | --- |
| Elephentity | `58a37e37b3fcab5338f9159c9e349703d4fc41be` |
| Tsquid | `82c27cdc6bc23ad004519f0b65a2c99738d50113` |
| Standalone GraphQL builder | `cc56d57e6ea6ed8edeaf0e4cdbd01195e8857ea9` |
| Standalone GraphQL runtime | `558719cdfe5dffa07c86e90dc53b97f9105a842c` |
| SQLite builder | `95681fb7dbf081b39e4f75953aa47aa5ff3a541b` |

## Confirmed enhancements filed for this project

| Gap | Issue | V1 decision / resolution |
| --- | --- | --- |
| Tsquid generates routes, not admin views/forms | [tsquid #7](https://github.com/hsimah-services/tsquid/issues/7) | Separate metadata-driven generator for explicit list/detail/create/edit allowlists, Astryx widgets, Relay bindings, validation and deterministic checks |
| Gateway/storage has no expected-version mutation contract | [elephentity #100](https://github.com/hsimah-services/elephentity/issues/100) | Deferred: the single-editor v1 has no conflict detection; future support uses opaque versions and atomic conditional mutations |
| Policy-filtered paging and counts | [elephentity #102](https://github.com/hsimah-services/elephentity/issues/102) | Accepted for the small v1 dataset; upstream keyset paging resumes after the last visible row |
| Publication fields appear in generic client inputs | [elephentity #103](https://github.com/hsimah-services/elephentity/issues/103) | Accepted framework limitation; explicit action-aware verifiers protect v1, future write visibility removes these fields from generic inputs |

The reports include evidence, concrete solutions, acceptance checks and compatibility
implications. Admin generation remains a blocker for claiming generated forms.
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

The website's [provides.json](provides.json) and [provides.md](provides.md) are
**temporary spec-review files** copied from reviewed builder declarations. Once the
implementation adds eleph.json and real builders, live `eleph validate spec`
replaces them and both files are removed. The snapshot is not permanent project
configuration or proof of builder compatibility.

Using the merged change's CLI, the actual command passed without generating files:

```text
eleph validate spec --provides spec/provides.json
Specs are valid: 4 entities, 2 types.
```

The upstream FormatChecker also passed canonical formatting. Independent JSON
Schema and reference checks passed all 10 model YAML files, expanded patterns,
action writes, admin field allowlists and 22 routes grouped across 10 entrypoints.
UI descriptor checks verify internal consistency only; Tsquid cannot consume admin.yml yet.

## Remaining checks, not yet demonstrated gaps

- Pin mutually compatible standalone packages and prove compiler/runtime wiring.
- SSR/prerender and initial-HTML SEO are deferred beyond v1, per review. The
  public frontend remains a client-rendered Tsquid app.
- SQLite upgrades remain application-owned reviewed migrations; the initial
  installer is not an upgrade engine.
