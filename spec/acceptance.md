# Acceptance checks for implementation

These are future implementation checks, not tests claimed to pass in this PR.

1. Eleph fmt/validate accept every entity, type and pattern with the actual SQLite
   and GraphQL integrations installed. generate --check reports no artifact drift;
   eleph check verifies real accessors. Tsquid route and UI checks are deterministic.
2. Creating Page, Post or Product reuses shared fields and starts as draft. Runtime
   supplies UTC createdAt/updatedAt; client attempts to set managed fields fail.
3. Publish commits status/time together; repeated publish retains first time.
   Unpublish removes public visibility immediately. Invalid direct updates cannot
   bypass title/body/status/time invariants. Create requires draft/null; changes
   to status/publishedAt require the appropriate action in actions().
4. Anonymous collection, count, by-slug and node requests cannot reveal drafts.
   Editor policy permits content changes but no deletion or profile changes. The
   single admin can update their email/displayName; bootstrap refuses additional
   accounts. Inactive users and expired sessions cannot operate the API.
5. User has no generated GraphQL exposure. Public content queries do not expose
   email, credentials or account links. Viewer/admin DTOs enforce their allowlists.
6. Duplicate/invalid slugs, normalized duplicate emails, unsafe enquiry URLs,
   oversized bodies/excerpts and injected HTML/script Markdown produce safe
   errors/output.
7. Every content list/detail/create/edit and operator profile detail/edit works
   by keyboard. Validation retains input, fields can be cleared, errors are announced and successful saves refresh Relay.
8. Login/logout, CSRF, cookie settings, session rotation, rate limits and
   session revocation are verified through HTTP-level checks.
9. Unknown/draft pages return public 404; home canonicalization works. Empty
   posts/products render cleanly. Ordering has ID tie-breakers.
   V1 accepts short/empty policy-filtered pages and slow counts; continuation
   remains available through pageInfo without exposing drafts.
10. The client renders published content and updates document metadata. SSR and
    initial-HTML SEO are deferred. Admin/draft responses avoid shared caching;
    unpublish invalidates public content responses.
11. Install works on an empty SQLite database only. Reviewed upgrade preserves
    content; backup restore succeeds. Secrets/database are unreachable over HTTP.

## Specification-only verification

Validate YAML shapes against the pinned upstream JSON Schemas and inspect pattern
expansion, references, action writes, route uniqueness and UI field allowlists.
This checks the proposal without generating application code. The real compiler
and FormatChecker passed using Elephentity PR #101 and the snapshot metadata in
provides.json. Live builder discovery, generated drift/conformance checks and all
runtime/UI acceptance scenarios remain for implementation.
