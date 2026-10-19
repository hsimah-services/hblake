# Page

A durable consulting page, addressed at `/pages/:slug`. Home (`/`) renders the
published Page whose slug is `home`. Initial suggested pages: home, services,
about and contact; copy and contact details must be supplied before publication.

Uses Content, Publishable and Timestamps without overriding them. Slugs are unique
within Page, not across content kinds. Empty bodies are allowed for drafts, but a
published Page must have a nonblank title and body. No hierarchy or block editor
in this version. Updating `home` affects `/` and `/pages/home` consistently;
`/pages/home` redirects to `/` to keep one canonical URL.

## Placement

Each Page chooses where it appears; only published pages appear anywhere.

- `showInNavigation` (default true) lists it in the header navigation, sorted by
  `navigationOrder` (default 100) then title. Home is always the header's Home link,
  never a text link.
- `featureOnHome` (default false) makes it a coloured home tile, sorted by
  `homeOrder` (default 100) then title. At most four tiles show; further featured
  pages wait until one is unfeatured or reordered.
- `accent` (`ink`, `green`, `orange`, `blue`, `berry`; default `ink`) is the tile
  colour and the navigation hover colour, from the `--site-*` palette. `ink` is the
  neutral text colour and has no tile, so a featured page must choose a colour.
- Orders are whole numbers from 0 to 999.

The `placed` query (GraphQL `placedPages(where: { home })`) returns the published
pages for the home page (`home: true`) or the navigation (`home: false`) in that order,
so the site never filters a partial page list.

News and Products are collections, not pages: their navigation links appear after
the pages whenever they have published records, with no placement settings.
The launch content features About, Frameworks, Portfolio and Contact us in that
order (green, orange, blue, berry) and keeps Home out of the navigation; migration
`0001-page-placement` sets the same on databases created before placement.

The `recent` query (GraphQL `recentPages(where: { status })`) lists records newest-edited
first, optionally of one status, under read policies. The admin dashboard uses it for
its counts and its Recently edited list.
