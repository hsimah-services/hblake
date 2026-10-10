# User

A private staff profile. Email is trimmed and normalized to lowercase before
persistence; uniqueness applies to that canonical value. Display name cannot be
blank. Admins create accounts, edit profiles, change roles and deactivate users.
Editors can read their own profile; profile changes go through an admin.

No public registration. Authentication credentials, password hashes, reset tokens
and sessions live in a separate server-owned authentication store, not this
entity or a generated content form. Account creation and credential provisioning
must succeed atomically, or leave an inactive account that cannot log in.

User intentionally has no GraphQL integration. The application supplies a narrow
authenticated admin API and a `viewer` profile DTO; exposing User wholesale could
leak email and inverse relationships. The initial admin is provisioned through an
explicit one-time operator command, not a public route or an authorization bypass
available in HTTP requests. Never remove or deactivate the last active admin.
Deactivation revokes sessions; role and active status are checked server-side on
every request. User deletion is omitted; deactivate instead.
