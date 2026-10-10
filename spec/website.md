# Website behavior

The site introduces a software engineering consulting business, explains its
services and products, and gives visitors a clear way to enquire. Launch content
can be limited to Home, Services, About and Contact Pages. Posts and Products can
remain empty, with useful empty states and no fabricated content.

Use a consistent header, navigation, footer and content layout. The owner supplies
business name, positioning, services, contact details and any legal copy before
launch. Public typography and spacing prioritize readable content. Follow Tsquid's
Astryx/StyleX UI conventions, keyboard access, visible focus and responsive layouts.

| Route | Behavior |
| --- | --- |
| `/` | Published Page with slug `home`; meaningful unavailable state if absent |
| `/pages/:slug` | Published Page by exact slug; home redirects to `/` |
| `/posts` | Published posts, newest first, cursor pagination, empty state |
| `/posts/:slug` | Published post or 404 |
| `/products` | Published offerings, title ascending then ID, pagination |
| `/products/:slug` | Published offering, optional safe enquiry link, or 404 |
| `/admin/login` | Staff login |
| `/admin` | Links to content management; Users link for admins |
| `/admin/{pages,posts,products,users}` | Authorized generated management views |

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
Titles are nonblank after trimming; excerpts are plain text for cards and metadata.
`publish` sets status and first `publishedAt` together; repeat publication retains
that timestamp. `unpublish` retains it. Verifiers enforce these invariants even
when a caller uses a direct generated update rather than an action.

Public lists, counts, node lookups and by-slug queries all enforce publication
policies. Draft detail requests return the same public 404 as unknown content.
Staff can open an authenticated draft preview using the detail rendering; that
preview must not enter shared caches or public search metadata.

Public pages need content-specific document title, description from excerpt,
canonical URL and social metadata. Content must be available in initial HTML for
search and link previews. Architecture verification must resolve SSR/prerender
support before launch. Cache public HTML only; invalidate changed content and
list/home outputs on update or unpublish. Never cache admin/session responses in
shared caches. No analytics, newsletter, uploads, search, comments or checkout.
