# Website behavior

The site introduces a software engineering consulting business, explains its
services and products, and gives visitors a clear way to enquire. Launch content
can be limited to Home, Services, About and Contact Pages. Posts and Products can
remain empty, with useful empty states and no fabricated content.

The site has a consistent header, navigation, footer and content layout. The owner supplies
business name, positioning, services, contact details and any legal copy before
launch. Public typography and spacing prioritize readable content. Its UI follows Tsquid's Astryx/StyleX conventions with keyboard access, visible
focus and responsive layouts.

| Route | Behavior |
| --- | --- |
| `/` | Published Page with slug `home`; meaningful unavailable state if absent |
| `/pages/:slug` | Published Page by exact slug; home redirects to `/` |
| `/posts` | Published posts, newest first, cursor pagination, empty state |
| `/posts/:slug` | Published post or 404 |
| `/products` | Published offerings, title ascending then ID, pagination |
| `/products/:slug` | Published offering, optional safe enquiry link, or 404 |
| `/admin/login` | Staff login |
| `/admin` | Links to content management and the operator account profile |
| `/admin/{pages,posts,products}` | Authorized generated content management views |
| `/admin/users/:id` and `/admin/users/:id/edit` | Operator profile detail and edit |

Navigation omits a link whose backing page is missing or draft. Show Posts and
Products navigation when published records exist. No arbitrary user-defined route
catch-all; Page URLs are namespaced to avoid collisions with admin and collections.

Unique slugs are lowercase ASCII letters/digits separated by single hyphens,
1–160 characters. Creation can suggest a slug from a title; server validation is
authoritative and collisions require correction. Existing slugs do not change when
titles change. A deliberate slug change changes the URL; redirects/history are
outside this version and the edit screen must make the consequence clear.

Markdown bodies store source text. Render with raw HTML disabled and sanitize
output and URLs. Draft content may be blank. Published content requires a nonblank
title and body. Limit request/body size to 1 MiB and enforce it on the server.
Titles are nonblank after trimming; excerpts are plain text for cards and metadata,
limited to 300 characters in the shared schema and form.
`publish` sets status and first `publishedAt` together; repeat publication retains
that timestamp. `unpublish` retains it. On create, verifiers require `draft` status
and null `publishedAt`. On update, changes to either field require the corresponding
`publish`/`unpublish` action in the mutation context's `actions()`; unchanged values
are allowed during ordinary saves. `unpublish` changes status only; `publish` stamps
first publication time from the server clock, using the persisted original timestamp
rather than a client-supplied pending value. Unpublish preserves the persisted
timestamp. Verifiers check those outcomes as well as action presence, so attaching
an action cannot authorize arbitrary timestamps. Arbitrary direct field changes are
rejected even though current generated inputs include those fields. The six generated
field-verifier contracts (two fields per content entity) share application logic.
Action-only field inputs are tracked in Elephentity #103 and are deferred for v1.

Public lists, counts, node lookups and by-slug queries all enforce publication
policies. Draft detail requests return the same public 404 as unknown content.
The operator can open an authenticated draft preview using the detail rendering; that
preview must not enter shared caches or public search metadata.

Public pages have content-specific document title, description from excerpt,
canonical URL and social metadata updated by the client. V1 renders on the client
with no SSR or prerender requirement. The HTML for each route carries that route's
query response as Tsquid initial data, so the first render does not wait on a GraphQL
round trip. Initial HTML still contains only the app shell markup; reduced
search/link-preview metadata is accepted before the business launches, and
initial-HTML SEO is deferred to a later rendering enhancement.

Text stays legible in both light and dark system colour schemes. Every screen's
document title names what it shows; only a missing record is titled "Not found".

V1 accepts policy-filtered paging that may produce short or empty pages and slow
counts on the small content dataset. Draft visibility remains enforced; clients use
pageInfo to offer continuation even from an empty page. Consistent keyset paging is
tracked upstream in Elephentity #102. There is no v1 published-query workaround.

Public content responses may be cached with invalidation on update or unpublish;
admin/session/draft responses are excluded from shared caches. The static app shell
contains no private content. V1 includes no analytics, newsletter, uploads, search,
comments or checkout.
