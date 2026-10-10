# Content administration

Each content kind has list, read-only detail, create and edit screens, using the
explicit fields in admin.yml. User screens are admin-only. Content screens are
available to active editors/admins. Route guards improve navigation; backend
policies enforce every read and write. IDs use GraphQL global IDs as string route
input, never unchecked numeric conversion.

Lists show bounded cursor pagination and useful empty/loading/error states. Detail
screens show rendered content plus timestamps. Forms use labels, inline errors,
a keyboard-accessible error summary and focused first invalid field. Markdown uses
a textarea and safe preview. Enums use explicit choices; enquiryUrl and optional
fields can be cleared. Distinguish omitted fields from explicit null/empty values.

New content starts as draft. Save and publish are separate operations. Publish and
unpublish refresh the record and relevant Relay lists. The server enforces status
invariants regardless of hidden UI fields. Managed timestamps and IDs appear only
as read-only information, never inputs. Generic edit forms do not expose status or
publishedAt as arbitrary editable values.

Disable duplicate submits while pending. Preserve input on validation, transport
or authorization errors. Successful saves show confirmation and update Relay data.
A concurrency conflict retains local values and offers reload/review, never silent
retry or overwrite. Dirty forms warn before navigation. A session expiring during
an edit does not discard text; keep it in memory without persisting sensitive User
fields to browser storage. Admin deletes need an explicit confirmation, apply
server permission checks and remove list/cache entries. Editors see no delete.

User creation provisions login credentials through the separate server-owned auth
flow; credentials are never fields in the generated generic form. With no email
service assumed, initial access is delivered by a documented operator procedure.
The last active admin cannot be demoted/deactivated, including by concurrent edits.

Generation must provide deterministic list/detail/form components, Relay operations
and field bindings from normalized metadata. Keep layout/labels/widgets configurable
through explicit input, without post-generation edits. A safe User DTO may use an
explicit descriptor with the same generator, without exposing the User entity.
Framework issue resolution is required before claiming these screens are generated.
