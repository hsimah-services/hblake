# Acceptance tests

These tests define "done" for the v1 site described in [spec/](../spec). They were
written before the implementation and fail until it exists. Make them pass by changing
the implementation. If a test seems wrong, raise it with the owner. Do not weaken, skip
or delete a test to get a green run.

```sh
tests/run.sh               # gates, then Playwright against a fresh stack, then ops
tests/run.sh gates         # one stage: gates | playwright | ops
PLAYWRIGHT_ARGS="--project=api --grep publish" tests/run.sh playwright
```

The host needs bash, python3, and podman or docker. Playwright runs in
`mcr.microsoft.com/playwright:v1.63.0-noble` with `--network host`.

| Stage | What runs | Where |
| --- | --- | --- |
| gates | `scripts/acceptance/gates` | host (your script) |
| playwright | `static` → `fresh` → `api` → `ui` projects | container |
| ops | `tests/ops/test_ops.py` (stdlib only) | host |

`run.sh` exports `BASE_URL` (default `http://localhost:8080`), `ADMIN_USERNAME` (default
`acceptance-operator`, lowercase), `ADMIN_PASSWORD` (random per run) and
`ADMIN_DISPLAY_NAME` (default `Site Operator`). It calls `scripts/acceptance/up` once,
before Playwright, and `down` on exit.

## Harness contract: `scripts/acceptance/*`

The implementation provides these executables. They run from the repository root on the
host, read the environment above, and may use containers internally. Exit 0 on
success.

| Script | Must |
| --- | --- |
| `gates` | Run every build gate and fail if any fails: `eleph fmt`, `eleph validate spec`, `eleph generate --check`, `eleph check`, PHPStan at level max, PHP unit tests, `tsquid-codegen … --check`, `relay-compiler --validate`, `pnpm lint` (eslint + `tsquid-check-architecture`), `tsc --noEmit` and the production build. |
| `up` | Start the whole site on one origin at `BASE_URL`: the built client, `POST /graphql` and `/auth/*`. Use a **new, empty** SQLite database, run the initial installer, run the operator bootstrap with `ADMIN_*`, and return once the site answers requests. |
| `down` | Stop the stack and discard its database. |
| `bootstrap` | Run the operator bootstrap command against the running stack's database, using `ADMIN_*`. Must exit non-zero when an account already exists. |
| `install` | Run the initial schema installer against the running stack's database. Must exit non-zero on a populated database. |
| `backup <path>` | Write a backup of the running stack's data, including uploaded images, to `<path>` on the host, using the documented operator procedure. |
| `restore <path>` | Restore that backup into the running stack, which must serve the restored data and images (and none uploaded since) when the script exits. |
| `expire-sessions` | Expire every session as though its lifetime had passed. Test hook. |
| `set-active <true\|false>` | Set the operator account's `active` flag. Test hook standing in for future lifecycle screens. |

## HTTP contract

The spec says "server sessions" and "CSRF protection on writes" without fixing the
endpoints. The tests fix them as follows:

- `GET /auth/csrf` → `200 {"token": "<string>"}`. The token belongs to the current
  session, anonymous or signed in. `Cache-Control: no-store`. This is the only place
  an anonymous session starts: GraphQL queries, static files and refused requests from
  a visitor without a session set no cookie.
- Session cookies carry `Secure` unless the request is plain HTTP to a loopback host
  (`localhost`, `127.0.0.1`, `[::1]`). The decision comes from the request, not from
  `BASE_URL` or other environment that a deployment might not set. The tests send
  `Host: www.example.test` to stand in for a public host behind a TLS proxy.
- `POST /auth/login` with JSON `{"username", "password"}` and header `X-CSRF-Token`:
  - Success → `200 {"viewer": {"id", "displayName", "role"}}`. It sets an HttpOnly,
    `SameSite=Lax|Strict`, `Path=/` session cookie (plus `Secure` when `BASE_URL` is
    https), rotates any pre-login session, and sends `Cache-Control: no-store`.
  - Wrong password, unknown username or inactive account → `401` with an identical body.
  - Missing or wrong CSRF token → `403`.
  - Too many failures → `429`. The limit must allow at least the five failed attempts
    the suite makes before the ops rate-limit test, and must trigger within 30
    attempts.
- `POST /auth/password` with JSON `{"currentPassword", "newPassword"}` and
  `X-CSRF-Token` changes the signed-in account's password:
  - Success → `200`, `Cache-Control: no-store`. The new password works, the old one
    stops working, the requesting session stays signed in and every other session of
    the account is revoked.
  - Signed out → `401`. Wrong current password → `401`, counted as a failed login for
    the rate limit. New password shorter than 12 characters → `400` with a JSON
    `{"error"}` that says so. Missing or wrong CSRF token → `403`. Nothing changes.
- `POST /auth/logout` with `X-CSRF-Token` → 2xx. The session is revoked server-side, so
  a copied cookie stops working. Without the token → `403`.
- `POST /graphql` (JSON `{query, variables}`):
  - Mutations need `X-CSRF-Token`. Without it, or with a wrong one, → `403` and
    nothing is applied. Queries need no token.
  - Responses to signed-in requests send `Cache-Control` with `no-store` or `private`.
  - Error messages may say which rule was broken. They never contain SQL, storage,
    PHP or stack details (`SQLSTATE`, constraint text, table names, file paths,
    date-parser output). Unexpected exceptions get a generic message.
  - Introspection stays enabled; `pnpm schema` needs it too.
- `POST /media` (multipart field `image`, `X-CSRF-Token`) stores a post image for a
  signed-in staff session → `201 {"url": "/media/<32 hex>.<png|jpg|webp>"}`. The type
  comes from the content (PNG, JPEG or WebP), never the name; anything else → `415`.
  Over 5 MB → `413`. Missing token or no staff session → `403`. Stored images carry no
  EXIF or other camera/location metadata.
- `GET /media/<name>` serves only stored names, with the image's `Content-Type`,
  `X-Content-Type-Options: nosniff` and a long `Cache-Control` max-age; any other path
  under `/media/` → `404`.

## HTML contract

Every route's HTML is the built client shell. The server runs that route's query (the
`query` named in `client/routes.json`) as the requesting viewer and inlines the
response before the first script, as tsquid specifies:

```html
<script type="application/json" id="tsquid-data">{"version":1,"responses":[{"operation":"…","variables":{…},"response":{"data":…}}]}</script>
```

- Exactly one response, for the route query, with the variables Relay will send
  (URL fields only). The client renders the route from it without a `/graphql`
  request.
- Read policies apply: visitors never receive drafts or the operator profile in HTML.
- Any `<` inside the JSON is escaped, so content cannot end the script element.
- HTML that carries data sends `Cache-Control` with `private` or `no-store`. Page views
  never start a session.
- URLs that match no route, or whose fields fail to parse, get the shell unchanged.

## GraphQL contract

Generated by `eleph-gen-graphql-php` from the spec (see `tests/acceptance/lib/content.ts`):

- **Reads:** `page(id)`, `pages(first, after)`, `pageBySlug(slug)`, and the same for
  `post` and `product`. Connections have `totalCount`, `pageInfo { hasNextPage
  endCursor }` and `nodes`. Pages default to 20 rows, with a maximum of 100. Ordering:
  - posts: `publishedAt` descending, then id descending;
  - products: `title` ascending, then id ascending.
- **Writes:** `create{Type}`, `update{Type}`, `publish{Type}`, `unpublish{Type}` and
  `delete{Type}`, each taking `input: {Mutation}Input!`. Payloads return the row under
  `page`/`post`/`product`; delete returns `deletedId`.
- **Enums:** `DRAFT`/`PUBLISHED` and `EDITOR`/`ADMIN`. Datetimes are ISO 8601 in UTC.
  Ids are global ids, and an id of one type must never resolve as another.
- **Relay:** `node(id: ID!)` resolves every content type and respects read policies.

Application-owned, with names fixed by these tests:

- `viewer: Viewer` with exactly `id`, `displayName` and `role`; `null` when signed out.
- `adminUser(id: ID!): AdminUser` with exactly `id`, `username` and `displayName`.
  Readable by the active admin only.
- `updateAdminUser(input: {id, displayName})` returning `{ adminUser }`. The username
  is the login and cannot be changed through GraphQL.
- `Post.author: Author` with exactly `displayName`: the byline, public wherever the
  post is. The username never appears in public responses.

`client/schema.graphql` matches the running server's schema exactly (types, fields,
arguments, input fields and enum values; descriptions are ignored).

Nothing else may mention users: there is no `User` type and no user create, list or
delete operations. No field anywhere looks like a password, credential, secret or
session.

## UI contract

The browser tests find elements by accessible role and name, not by test ids:

- Public pages have a `banner`, `navigation`, `main` and `contentinfo`. The content
  title is the `h1`.
- Text meets WCAG AA contrast (4.5:1) in both light and dark system colour schemes,
  and after the header toggle switches mode. The toggle is a `banner` button named
  `Switch to dark mode`/`Switch to light mode`; the choice survives reloads and is
  applied before the application scripts run.
- The palette in `client/src/styles/global.css` (`--site-tile-*` and the
  `light-dark()` `--site-*` tones) keeps every pair of tones at least ΔE2000 10 apart
  under simulated protanopia, deuteranopia and tritanopia, and AA contrast as text.
- The navigation marks the current page (`aria-current="page"`) or section
  (`aria-current="true"` on a collection's records) by more than colour: its 2px
  underline (a centred gradient `background-size` of `100% 2px`) stays drawn; other
  links show it only on hover or focus. The Home icon link is the exception: it never
  draws an underline or a current tint, and keeps `aria-current` for assistive
  technology.
- A `banner` button named `Turn off animations`/`Turn on animations` controls motion.
  It starts from the system's reduced-motion setting, survives reloads and applies
  before the application scripts run (`data-motion` on `<html>`). With animations off,
  navigation transitions take under 10ms and home tiles do not grow on hover.
- The colour mode and animation toggles share one `group` named `Display preferences`:
  one Tab stop, arrow keys between them, and focus rings the group does not clip.
- At 360px wide nothing scrolls sideways. The `Main navigation` holds a `Menu` button
  with `aria-expanded` and `aria-controls`; Escape closes it and focuses the button,
  and following a link closes it. Menu, navigation, mode and animation toggles and
  footer links are at least 44×44px.
- `document.title` starts with what the screen shows: the content title, the list
  name (`Posts`), `Dashboard`, `Sign in`, `Create Post`, `Edit <title>`. Only a
  missing record is titled "Not found".
- Unknown or unpublished content renders a heading matching `/not found/i`.
- The empty post and product lists say "No posts" and "No products".
- A product's enquiry link is named `/enquir/i`.
- List pagination is a link or button named `/next|older|more/i` that puts `?after=`
  in the URL. Paging one list never changes the site navigation.
- Links between routes are handled by the client router: following a navigation,
  list or admin link keeps the same document (no full page load).
- Following a link fetches its route query once, even when hovering it preloaded the
  route first.
- A route query that returns GraphQL errors shows an error, never the not-found state.
- Login: fields labelled `Username` and `Password`, and a `Sign in`/`Log in` button.
  Signed-out visits to `/admin*` redirect to `/admin/login`. Sign-out is a button or
  link named `/sign out|log out/i`.
- Content forms have fields labelled `Title`, `Slug`, `Content` (a textarea), `Excerpt`
  and, for products, `Enquiry URL`, with a `Save`/`Create` button. They have no
  inputs for id, status, publication time or timestamps. Posts edit `Content` as rich
  text: a `textbox` named `Content` (multiline, contenteditable) under a `toolbar` named
  `Formatting` (Bold, Italic, Strikethrough, Inline code, Heading 2, Heading 3,
  Bulleted list, Numbered list, Quote, Code block, Link, Image, Undo, Redo; toggles
  report `aria-pressed`; one Tab stop with arrow keys). An `Editing mode` radio group
  switches to `Markdown`, where `Content` is the textarea; Markdown is what is saved.
  The `Link` dialog accepts only https/http, mailto or site paths. The `Insert image`
  dialog requires `Alt text`, uploads through `POST /media` and inserts
  `![alt](/media/…)`, which the published post shows as an image with that alt text.
- Detail views have `Publish`/`Unpublish` and `Delete` buttons. Delete opens a
  `dialog`/`alertdialog` with a cancel button and a confirm button. It is modal:
  focus moves into it, Tab and Shift+Tab stay inside it, Escape closes it without
  deleting, and focus returns to the Delete button.
- Invalid fields get `aria-invalid="true"`, and the first invalid field receives focus.
  Errors appear in a `role="alert"` region, and save confirmations in
  `role="status"`/`alert` (text matching `/saved|created|updated/i`).
- A write the server refuses (for example `403` for a stale CSRF token) shows an
  announced error without transport details (`GraphQL`, status codes) and keeps input.
- The Markdown preview may sit behind a `Preview` tab or button.
- Settings (`/admin/users/:id`, linked from the admin home as `Settings`) show the
  username and display name and have a change-password form: `Current password`,
  `New password`, `Confirm new password` and a `Change password` button. Mismatched or
  short new passwords are refused before sending; success is announced as updated.
- The profile form (`/admin/users/:id/edit`) has one field, `Display name`.
- Admin screens sit in a shell with a `navigation` named `Administration` linking
  Dashboard, Pages, Posts, Products and Settings; the current one has
  `aria-current="page"`. On phones its links open in a drawer `dialog` from an
  `Open navigation` button.
- Admin lists are tables with the `spec/ui/admin.yml` list columns (Title, Slug,
  Status, Published for posts, Updated). Under each title are links `View “<title>”`
  and `Edit “<title>”` and a button `Delete “<title>”`, which confirms in a dialog,
  stays on the list, announces the deletion in a `status` and focuses the heading.
  The list links `Add new <type>`. On a 360px screen the row actions stay on screen
  as 44px targets.
- Timestamps in the admin read relatively in a `<time datetime>`; the absolute time is
  the `aria-label` and appears when the element (a Tab stop) is focused or hovered.
- Published posts show `By <display name>` on the post and in the post list.
- A dirty form warns before in-app navigation, through `confirm()` or a dialog with a
  stay/cancel button.

## Repository rules

`static/client.spec.ts` and `static/repository.spec.ts` also check that:

- each entrypoint in `client/routes.json` preloads its own query, defined in its own
  directory and named after its module (`PostQuery`, `AdminPostQuery`, …); no two
  entrypoints share a query;
- `client/src` builds route paths with the generated URI builders: no string or
  template literal starting with `/admin`, `/pages`, `/posts` or `/products`;
- every `__generated__/*.graphql.ts` belongs to an operation or fragment defined in
  the directory above it;
- the client contains no business description the owner has not supplied (the word
  "consult" in any form);
- `elephentity/*` packages are released versions: no `dev-` branches, `as` aliases or
  extra VCS repositories, and tagged versions in `composer.lock`;
- spec and README docs don't refer to the removed provides snapshot or hardcode test
  counts.

## Coverage

Spec acceptance checks and where they are tested:

| Acceptance | Tests |
| --- | --- |
| 1 gates | `gates` stage; `static/repository.spec.ts` |
| 2 shared fields, drafts, managed timestamps | `api/content-lifecycle.spec.ts`, `api/schema.spec.ts` |
| 3 publication rules | `api/publication.spec.ts` |
| 4 visibility and authorization | `api/visibility.spec.ts`, `api/profile.spec.ts`, `api/password.spec.ts`, `ops` (bootstrap, inactive, expired) |
| 5 no User exposure | `api/schema.spec.ts`, `api/visibility.spec.ts`, `static/repository.spec.ts` |
| 6 validation and safe output | `api/validation.spec.ts` (including safe error messages), `api/profile.spec.ts`, `ui/public-site.spec.ts` |
| 7 keyboard admin | `ui/admin.spec.ts`, `ui/admin-profile.spec.ts` |
| 8 auth over HTTP | `api/auth.spec.ts` (including lazy sessions and `Secure`), `ops` (rate limit) |
| 9 404s, empty states, ordering, paging | `fresh/empty-site.spec.ts`, `api/pagination.spec.ts`, `ui/public-site.spec.ts` |
| Frontend architecture (architecture.md) | `static/client.spec.ts`, `api/schema.spec.ts`, `ui/public-site.spec.ts`, `ui/admin.spec.ts` |
| Upstream pins (upstream.md) | `static/repository.spec.ts` |
| 10 client rendering, metadata, caching | `ui/public-site.spec.ts`, `api/auth.spec.ts`, `api/publication.spec.ts` |
| Initial data (architecture.md) | `api/initial-data.spec.ts`, `ui/public-site.spec.ts` |
| Colour schemes and titles (website.md) | `ui/public-site.spec.ts`, `ui/admin.spec.ts`, `ui/color-mode.spec.ts`, `static/palette.spec.ts` |
| Phone layout (website.md) | `ui/mobile.spec.ts` |
| Animations and the motion toggle (website.md) | `ui/motion.spec.ts` |
| Rich-text posts and images (website.md, ui/admin.md) | `ui/editor.spec.ts`, `api/media.spec.ts`, `ops` (backup) |
| Admin shell, tables and timestamps (ui/admin.md) | `ui/admin-shell.spec.ts` |
| 11 install, backup, secrets | `ops`, `api/http.spec.ts` |

Not covered, and why:

- **Editor-role policy.** v1 bootstraps one admin and refuses a second account, so no
  editor session can exist over HTTP. Cover `ContentStaff` and `AdminAccounts` with PHP
  unit tests of the policy classes.
- **Duplicate usernames.** There is only one account to collide with. Cover the
  unique constraint and the username rule with unit tests.
- **Session expiring mid-edit while the form keeps its text,** and multi-tab
  overwrites (accepted in v1).
- **Purging expired sessions and login-failure rows.** There's no black-box view of the
  session table. Cover the purge with a PHP unit test.
- **Reviewed upgrade migrations.** There is no prior schema yet. Add a test with the
  first migration.
- **SSR and initial-HTML SEO** (deferred), **concurrency conflicts** (deferred,
  elephentity#100) and **action-only inputs** (elephentity#103).
- **Shared-cache invalidation** beyond the API serving fresh data after unpublish: no
  CDN is chosen yet.
