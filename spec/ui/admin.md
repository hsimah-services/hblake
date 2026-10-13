# Content administration

Each content kind has list, read-only detail, create and edit screens, using the
explicit fields in admin.yml. The current implementation shares handwritten
application components while Tsquid #7 is unresolved; these are not generated screens. The single operator account has detail/edit only;
User list/create screens and role/active editing are outside v1. User screens
are admin-only. Content screens are available to active editors/admins. Route guards improve navigation; backend
policies enforce every read and write. IDs use GraphQL global IDs as string route
input, never unchecked numeric conversion.

Lists show bounded cursor pagination and useful empty/loading/error states. Detail
screens show rendered content plus timestamps. Forms use labels, inline errors,
a keyboard-accessible error summary and focused first invalid field. Markdown uses
a textarea and safe preview. Enums use explicit choices; enquiryUrl and optional
fields can be cleared. Forms distinguish omitted fields from explicit null/empty values.

New content starts as draft. Save and publish are separate operations. Publish and
unpublish refresh the record and relevant Relay lists. The server enforces status
invariants regardless of hidden UI fields. Managed timestamps and IDs appear only
as read-only information, never inputs. Generic edit forms do not expose status or
publishedAt as arbitrary editable values.

Forms disable duplicate submits while pending and preserve input on validation,
transport or authorization errors. Successful saves show confirmation and update Relay data.
V1 has no concurrency-conflict flow or expected-version input. Dirty forms warn
before navigation. A session expiring during an edit does not discard text;
local values remain in memory without persisting sensitive User fields to browser
storage. Admin deletes need an explicit confirmation, apply
server permission checks and remove list/cache entries. Editors see no delete.

The operator account is provisioned by an explicit bootstrap procedure with its
separate server-owned credentials; credentials never appear in the generated
profile form. Settings change the password through the authentication endpoint,
not GraphQL. No email service, additional-account workflow, role/deactivation
controls or last-admin invariant is required for v1.

Generation must provide deterministic list/detail/form components, Relay operations
and field bindings from normalized metadata. Layout/labels/widgets are configurable
through explicit input. A safe User DTO may use an
explicit descriptor with the same generator, without exposing the User entity.
Framework issue resolution is required before claiming these screens are generated.
