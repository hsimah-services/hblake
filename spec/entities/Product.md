# Product

A software product or packaged consulting offering, addressed at `/products/:slug`
and listed at `/products`. Uses Content, Publishable and Timestamps.

`enquiryUrl` is an optional CTA URL, restricted to HTTPS or a valid mailto URL;
render a link only when present. Title/body/excerpt describe the offering; no
price, inventory, payment, order or checkout model is implied. Publication
requires a nonblank body. Empty catalogues have a useful empty state.

The `recent` query (GraphQL `recentProducts(where: { status })`) lists records newest-edited
first, optionally of one status, under read policies. The admin dashboard uses it for
its counts and its Recently edited list.
