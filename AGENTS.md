# Working in this repo

The owner has authorized website implementation against the tests in tests/.
Deployment remains a separate operator action.

## Specification and framework work

- Read spec/README.md and its linked system documents before implementation.
- Keep Elephentity model keys in its supported schema. spec/ui/admin.yml is a
  proposed UI contract; its keys do not belong in routes.json or entity YAML.
- Change model YAML directly; Markdown records intent and stays aligned with it.
- Generated artifacts are machine-owned. Fix specifications or upstream generators
  instead of editing generated output or copying a private generator fork here.
- Component directories use lowercase kebab-case. Group routes for one entity
  under one entrypoint and route context, following Tsquid's architecture checker.
- Follow Tsquid's Astryx/StyleX UI standards. Verify authorization on the server;
  hidden fields and client route guards do not enforce permissions.
- Raise demonstrated Elephentity/Tsquid gaps upstream with evidence, impact,
  detailed solutions, compatibility implications and acceptance checks. Link
  existing reports instead of duplicating them. User decisions on scope take
  precedence over framework guidance.
- Use live eleph validate with eleph.json and the actual configured builders.
  Do not restore the removed specification-review metadata snapshots.
- Run validation/format checks appropriate to model changes. Build/run instructions
  belong in README once the actual implementation commands exist.
- Business copy, claims, branding and contact details come from the owner.

## Acceptance tests

- tests/ is the verification for the implementation; tests/README.md defines the
  harness, HTTP, GraphQL and UI contracts it relies on. `tests/run.sh` must pass.
- Implement scripts/acceptance/* as described there. Do not edit, skip or weaken a
  test to make it pass; raise a disagreement with the owner instead.
