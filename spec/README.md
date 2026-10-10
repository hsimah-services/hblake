# Consulting website specification

Status: specification only. Implementation begins after review of this PR.
No application, generated artifacts, dependency installation in this repo,
database migration, content import or deployment is part of this change.

The YAML under `entities`, `patterns` and `types`, plus `project.yml`, is the
Elephentity model source of truth. Entity Markdown records intent. The UI route
catalogue uses Tsquid's existing format; entrypoint paths are planned files.
`ui/admin.yml` is a **proposed application UI contract**, not an input currently
accepted by Tsquid. Do not add those keys to `routes.json` or Elephentity YAML.

Read [website.md](website.md), [architecture.md](architecture.md),
[ui/admin.md](ui/admin.md), [acceptance.md](acceptance.md) and
[upstream.md](upstream.md) before implementing.

## Assumptions for review

- Standalone PHP with SQLite, rather than WordPress storage or hosting.
- React/Tsquid public site and admin, Relay over standalone Elephentity GraphQL.
- Markdown editing with sanitized rendering; no rich text or block editor.
- Editors manage and publish all content; admins also manage users and delete content.
- Products are informational offerings with an enquiry link, without commerce.
- No public registration. Staff login uses server sessions and operator bootstrap.
- Two publication states, draft and published; no scheduled publication or revisions.
- UTC creation/update timestamps and first publication timestamp.
- Brand copy, logo, domain, contact address, hosting and final visual treatment are
  not yet selected. Do not invent business claims or contact details.

The current repo has an empty README and no checked-in application or content
to migrate. Add build/run instructions during implementation, once real commands
exist.
