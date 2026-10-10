# Acceptance checks for implementation

These are future implementation checks, not tests claimed to pass in this PR.

1. Eleph fmt/validate accept every entity, type and pattern with the actual SQLite
   and GraphQL integrations installed. generate --check reports no artifact drift;
   eleph check verifies real accessors. Tsquid route and UI checks are deterministic.
2. Creating Page, Post or Product reuses shared fields and starts as draft. Runtime
   supplies UTC createdAt/updatedAt; client attempts to set managed fields fail.
3. Publish commits status/time together; repeated publish retains first time.
   Unpublish removes public visibility immediately. Invalid direct updates cannot
   bypass title/body/status/time invariants.
4. Anonymous collection, count, by-slug and node requests cannot reveal drafts.
   Editors can manage all content but cannot delete or modify users. Admins can
   manage users; inactive users and expired sessions cannot operate the API.
5. User has no generated GraphQL exposure. Public content queries do not expose
   email, credentials or account links. Viewer/admin DTOs enforce their allowlists.
6. Duplicate/invalid slugs, normalized duplicate emails, unsafe enquiry URLs,
   oversized bodies and injected HTML/script Markdown produce safe errors/output.
7. Every admin list/detail/create/edit works by keyboard. Validation retains input,
   fields can be cleared, errors are announced and successful saves refresh Relay.
8. Two clients editing one record cause one stale write to fail without data loss,
   including publish/delete. Concurrent admin deactivations cannot remove the last
   active admin. Verify races with independent database connections.
9. Login/logout, CSRF, cookie settings, session rotation, rate limits and
   deactivation/session revocation are verified through HTTP-level checks.
10. Unknown/draft pages return public 404; home canonicalization works. Empty
    posts/products render cleanly. Cursor limits/order remain stable for ties.
11. Initial HTML contains published body and metadata without requiring JavaScript.
    Admin/draft responses avoid shared caching; unpublish invalidates public output.
12. Install works on an empty SQLite database only. Reviewed upgrade preserves
    content; backup restore succeeds. Secrets/database are unreachable over HTTP.

## Specification-only verification

Validate YAML shapes against the pinned upstream JSON Schemas and inspect pattern
expansion, references, action writes, route uniqueness and UI field allowlists.
This checks the proposal without generating application code. The real compiler
and FormatChecker passed using Elephentity PR #101 and the snapshot metadata in
provides.json. Live builder discovery, generated drift/conformance checks and all
runtime/UI acceptance scenarios remain for implementation.
