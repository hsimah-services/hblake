# Post

A consulting article or business update, presented as News: addressed at
`/news/:slug` and listed at `/news`. Uses Content, Publishable and Timestamps. The list sorts by
`publishedAt` descending, then ID descending, and supports bounded pagination.

No posts are invented to fill the site. No comments, categories, tags or public
author accounts in this version. Every post is written by the site's single account
and shows a `By <display name>` byline; the public `Post.author` projection carries
only that display name. Publication requires a nonblank body. Drafts
never appear in anonymous lists, counts, node queries or direct links.
