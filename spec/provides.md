# Validation metadata provenance

**Temporary:** this file and provides.json exist only for spec review. Implementation
with eleph.json and real builders replaces snapshot validation with live
`eleph validate spec` and removes both files.

`provides.json` is a spec-review snapshot in the existing orchestrator describe
response shape. Its target values are copied unchanged from each builder's checked-in
`rust/provides.json`, without running builders or generating website artifacts.
No pooled package patterns/types are needed by this project.

| Target | Source commit | Source file SHA-256 |
| --- | --- | --- |
| sqlite | `95681fb7dbf081b39e4f75953aa47aa5ff3a541b` | `f6a3cd54732b0eb4f53d8ddf86d3bc03b11326837dd0ece546e672e1cab95315` |
| graphql-php | `cc56d57e6ea6ed8edeaf0e4cdbd01195e8857ea9` | `744bd1a6b24142b2653c4284a94b1fbf5b145cc6ea8a7a273bab7e732becc9ba` |

With the merged Elephentity validation change installed, run from this repo:

```sh
vendor/bin/eleph validate spec --provides spec/provides.json
```

This checks schema shapes, sealed pattern composition, types/references, action
writes and known integration settings through the real compiler. It creates no
application artifacts and needs no eleph.json or builder binaries. It does not
check application verifiers, credentials, UI generation or generated conformance.

This snapshot proves validity against the reviewed metadata only; it does not prove
compatibility of a different installed release set. Live validation becomes the
implementation and CI workflow when the actual builders are present.
