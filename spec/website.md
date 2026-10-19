# Website behavior

The hblake site introduces Hamish Blake and the open frameworks behind his work.
Owner-provided launch content consists of Home, About, Portfolio and Contact us, plus
the Products page, which holds the open frameworks (Elephentity, tsquid, Markr) as items. The homepage shows up to four large coloured links to pages featured on
it (page placement, see Page.md; the launch content features About, Products,
Portfolio and Contact us), followed by the latest published News item ("Latest news") when one exists. News, Products and
any other page that holds items may have none. News and Products are pages that hold items
(see PageItem.md): Articles and Products.
News carries hbla.ke's business and technical writing; personal writing stays on
hsimah.com, which the footer links. The two do not otherwise cross-link.

The header provides understated page navigation. The footer includes copyright,
icon links to hsimah.com, hsimah-services on GitHub and Hamish’s LinkedIn.
The icons use assets from the owner’s hsimah repository, have accessible names,
and open in a new tab. Contact links point to
GitHub and LinkedIn; no email address or contact form is published. The portfolio
explains that customer permission is pending, without publishing customer details.
Public typography and spacing prioritize readable content. The UI follows tsquid’s
Astryx/StyleX conventions with keyboard access, visible focus and responsive layouts.

Owner-approved content lives in content/pages.json and can replace existing Page,
PageItem records with the explicit operator command `replace-content`.
That command preserves accounts, credentials and sessions, and publishes the seed
pages (the four launch pages plus News and Products) through the normal runtime contracts in one transaction.

| Route | Behavior |
| --- | --- |
| `/` | Published Page with slug `home`; meaningful unavailable state if absent |
| `/pages/:slug` | Published Page by exact slug; home redirects to `/` |
| `/pages/:slug` | A page holds its content and, when it holds items, its published items newest first, with cursor pagination and an empty state ("No news") |
| `/:page/:item` | Published item of a published page, optional safe enquiry link, or 404. Found only under its own page |
| `/news/feed.xml` | Atom feed of the News page's published items, newest first |
| `/admin/login` | Staff login |
| `/admin` | Dashboard: counts per content type, links to manage and add each, and settings |
| `/admin/pages` | Authorized page management views |
| `/admin/items/:page` | Authorized management views for the items of a page that holds items (News, Products) |
| `/admin/users/:id` and `/admin/users/:id/edit` | Settings (username, display name, password change) and display-name edit |

Navigation omits a link whose backing page is missing or draft; News and Products appear
as the pages they are. No arbitrary user-defined route catch-all; page slugs that would
shadow a fixed route (`admin`, `assets`, `auth`, `graphql`, `media`, `pages`) are
reserved, because items live at `/<page-slug>/<item-slug>`. The old `/news`, `/products`,
`/posts` and `/admin/news` addresses are gone and are not redirected.

Unique slugs are lowercase ASCII letters/digits separated by single hyphens,
1–160 characters. Creation can suggest a slug from a title; server validation is
authoritative and collisions require correction. Existing slugs do not change when
titles change. A deliberate slug change changes the URL; redirects/history are
outside this version and the edit screen must make the consequence clear.

Markdown bodies store source text. Render with raw HTML disabled and sanitize
output and URLs. Items may contain images uploaded by staff: PNG, JPEG or WebP up to
5 MB, checked by content, re-encoded so no camera or location metadata survives,
stored under random names in a private media directory beside the database and
served from `/media/<name>`. Every image has alt text. Backups include the images. Draft content may be blank. Published content requires a nonblank
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
query response as tsquid initial data, so the first render does not wait on a GraphQL
round trip. Initial HTML still contains only the app shell markup; reduced
search/link-preview metadata is accepted before the business launches, and
initial-HTML SEO is deferred to a later rendering enhancement.

Accessibility comes first. Text keeps WCAG AA contrast in light and dark. The site
follows the system colour scheme until the visitor chooses one with the header toggle
("Switch to dark/light mode"); the choice is remembered on the device and applied
before first paint. The palette (green, orange, blue, berry) stays distinguishable
with protanopia, deuteranopia and tritanopia, and colour never carries meaning alone:
the current page in the navigation is also underlined and marked with `aria-current`.
The Home icon shows no visual current state or underline; it keeps `aria-current`.

Navigation links fade in a tint and grow a 2px underline out from the middle on hover
and focus, shrinking back on leave; home tiles grow slightly. A header toggle ("Turn
off/on animations") switches all of this off for visitors who prefer less motion. It
follows the system's reduced-motion setting until the visitor chooses, remembers the
choice on the device and applies it before first paint. With animations off, states
still change (the underline still appears) but nothing moves over time.

On phone-sized screens nothing scrolls sideways, the navigation collapses behind a
Menu disclosure button (Escape, an outside tap or following a link closes it and
returns focus), and touch targets are at least 44 by 44 pixels. Every screen's
document title names what it shows; only a missing record is titled "Not found".

V1 accepts policy-filtered paging that may produce short or empty pages and slow
counts on the small content dataset. Draft visibility remains enforced; clients use
pageInfo to offer continuation even from an empty page. Consistent keyset paging is
tracked upstream in Elephentity #102. There is no v1 published-query workaround.

Public content responses may be cached with invalidation on update or unpublish;
admin/session/draft responses are excluded from shared caches. The static app shell
contains no private content. V1 includes no analytics, newsletter, uploads, search,
comments or checkout.
