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

| Gap | Issue | Required resolution |
| --- | --- | --- |
| Tsquid generates routes, not admin views/forms | [tsquid #7](https://github.com/hsimah-services/tsquid/issues/7) | Separate metadata-driven generator for explicit list/detail/create/edit allowlists, Astryx widgets, Relay bindings, validation and deterministic checks |
| Gateway/storage has no expected-version mutation contract | [elephentity #100](https://github.com/hsimah-services/elephentity/issues/100) | Opaque storage versions, atomic conditional updates/actions/deletes, typed conflicts and adapter conformance tests |

Each new issue includes evidence, a concrete solution, acceptance checks and
compatibility implications. Admin generation is a blocker for claiming generated
forms. Portable concurrency support is an enhancement; an application-specific
SQLite solution is acceptable only with demonstrated atomic race protection.

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

Existing `eleph validate` does not generate application code, but it discovers
capabilities by invoking configured builders. The follow-up Elephentity PR adds
`--provides <saved-describe-json>` to use the same compiler with explicit snapshot
metadata and no builder execution or `eleph.json`. The snapshot must carry source
revisions and be refreshed with dependencies; it does not prove build compatibility.
Submitted: [Elephentity PR #101](https://github.com/hsimah-services/elephentity/pull/101),
commit `b295fe0`. The website includes [provides.json](provides.json) with
[source provenance](provides.md), copied from the reviewed builders' declarations.

Using that PR's CLI, the actual command passed without generating files:

```text
eleph validate spec --provides spec/provides.json
Specs are valid: 4 entities, 2 types.
```

The upstream FormatChecker also passed canonical formatting. Independent JSON
Schema and reference checks passed all 10 model YAML files, expanded patterns,
action writes, admin field allowlists and 24 unique routes. UI descriptor checks
verify internal consistency only; Tsquid cannot consume admin.yml yet.

## Remaining checks, not yet demonstrated gaps

- Pin mutually compatible standalone packages and prove compiler/runtime wiring.
- Verify Tsquid-compatible initial HTML rendering for public content. If an actual
  compatibility spike demonstrates a missing feature, file a focused upstream issue
  with its reproduction and proposed adapter rather than guessing now.
- SQLite upgrades remain application-owned reviewed migrations; the initial
  installer is not an upgrade engine.
