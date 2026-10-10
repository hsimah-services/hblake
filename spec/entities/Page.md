# Page

A durable consulting page, addressed at `/pages/:slug`. Home (`/`) renders the
published Page whose slug is `home`. Initial suggested pages: home, services,
about and contact; copy and contact details must be supplied before publication.

Uses Content, Publishable and Timestamps without overriding them. Slugs are unique
within Page, not across content kinds. Empty bodies are allowed for drafts, but a
published Page must have a nonblank title and body. No hierarchy or block editor
in this version. Updating `home` affects `/` and `/pages/home` consistently;
`/pages/home` redirects to `/` to keep one canonical URL.
