# Acceptance checks for implementation

The implementation is verified by the owner-maintained tests/run.sh plus the
application tests in server/tests. The original acceptance tests are unchanged.
`tests/run.sh` passes.

1. Eleph fmt/validate accept every entity, type and pattern with the actual SQLite
   and GraphQL integrations installed. generate --check reports no artifact drift;
   eleph check verifies real accessors. tsquid route and UI checks are deterministic.
2. Creating a Page or PageItem reuses shared fields and starts as draft. Runtime
   supplies UTC createdAt/updatedAt; client attempts to set managed fields fail.
3. Publish commits status/time together; repeated publish retains first time.
   Unpublish removes public visibility immediately. Invalid direct updates cannot
   bypass title/body/status/time invariants. Create requires draft/null; changes
   to status/publishedAt require the appropriate action in actions().
4. Anonymous collection, count, by-slug and node requests cannot reveal drafts.
   Editor policy permits content changes but no deletion or profile changes. The
   single admin can update their displayName and password; bootstrap refuses additional
   accounts. Inactive users and expired sessions cannot operate the API.
5. User has no generated GraphQL exposure. Public content queries do not expose
   the username, credentials or account links; pages and items carry only the author display
   name. Viewer/admin/author DTOs enforce their allowlists.
6. Duplicate/invalid slugs, duplicate or invalid usernames, unsafe enquiry URLs,
   oversized bodies/excerpts and injected HTML/script Markdown produce safe
   errors/output.
7. Every content list/detail/create/edit and operator profile detail/edit works
   by keyboard. Validation retains input, fields can be cleared, errors are announced and successful saves refresh Relay.
8. Login/logout, CSRF, cookie settings, session rotation, rate limits and
   session revocation are verified through HTTP-level checks.
9. Unknown/draft pages return public 404; home canonicalization works. Empty
   pages without items render cleanly. Ordering has ID tie-breakers.
   V1 accepts short/empty policy-filtered pages and slow counts; continuation
   remains available through pageInfo without exposing drafts.
10. The client renders published content and updates document metadata. Route HTML
    inlines the route query response for the requesting viewer, which the client uses
    without a GraphQL request; drafts and private profile data are never inlined for
    visitors. SSR and initial-HTML SEO are deferred. Admin/draft responses and HTML
    carrying data avoid shared caching; unpublish invalidates public content responses.
    Text is legible in light and dark colour schemes, and document titles name each screen.
11. Install works on an empty SQLite database only. Reviewed upgrade preserves
    content; backup restore succeeds. Secrets/database are unreachable over HTTP.

## Implementation verification

Live `eleph validate spec` discovers the configured builders. Canonical formatting,
generated drift/accessor checks, maximum-level PHPStan, application unit tests,
tsquid routes, server/client schema agreement, Relay artifacts, lint, TypeScript,
production build and HTTP/UI/operator acceptance checks run through `tests/run.sh`.
