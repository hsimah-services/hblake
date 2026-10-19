# Consulting website specification

Status: v1 implementation passes the owner-provided acceptance tests.
Build/run commands and generation boundaries are documented in the root README.

The YAML under `entities`, `patterns` and `types`, plus `project.yml`, is the
Elephentity model source of truth. Entity Markdown records intent. The UI route
catalogue uses tsquid's existing format; entrypoint paths name application files.
`ui/admin.yml` is a **proposed application UI contract**, not an input currently
accepted by tsquid.

System behavior is described in [website.md](website.md), [architecture.md](architecture.md),
[ui/admin.md](ui/admin.md), [acceptance.md](acceptance.md) and [upstream.md](upstream.md).
Contributor instructions live in [AGENTS.md](../AGENTS.md).

## Assumptions for review

- Standalone PHP with SQLite, rather than WordPress storage or hosting.
- React/tsquid public site and admin, Relay over standalone Elephentity GraphQL.
- Rich-text editing stored as Markdown, with sanitized rendering; no block editor.
- V1 has one operator-provisioned admin account. The model retains editor/admin
  roles; additional accounts and account lifecycle screens are outside v1.
- Articles, products and framework entries are PageItems attached to pages that hold items.
  Products are informational offerings with an enquiry link, without commerce.
- No public registration. Staff login uses server sessions and operator bootstrap.
- Two publication states, draft and published; no scheduled publication or revisions.
- UTC creation/update timestamps and first publication timestamp.
- V1 is client-rendered with tsquid initial-data hydration of each route's query;
  SSR/prerender and initial-HTML SEO are deferred.
- Policy-filtered paging limitations are accepted for the small v1 dataset.
- Concurrent edit detection is deferred until Elephentity #100 is available.
- Owner-provided launch copy is in content/pages.json; the site name is hblake.
  Public contact uses GitHub and LinkedIn. Hosting and deployment remain operator work.

The root README documents the application toolchain and operator procedures.
Live builder validation replaces the removed temporary provides snapshot.
Owner-provided launch content is installed explicitly with `replace-content`;
acceptance startup continues to use an empty content database.
