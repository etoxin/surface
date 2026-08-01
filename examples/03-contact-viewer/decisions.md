# Contact Viewer Decisions

## Lookup

`contactById` declares a private `contactLookup` input collection and outputs
the global `contact` collection. Typed string annotations make both references
checkable. Ordered function logic explains the lookup and says a failed lookup
produces null.

The example implementation maps `/contacts?id=ada` to the input collection's
`id` field. That URL mapping is an implementation choice, not Surface syntax.

## Interface and Screens

`contactViewer` is an intent-driven interface. Its context references the
function and collection while describing the input and displayed contact
fields. Its logic references the function for the required missing-input and
missing-result reactions. Surface leaves the exact controls, copy, and layout
to the implementer.

The `contact` screen uses that interface. The `home` screen uses logic to open
the checked `(screen)"contact"` reference without adding structured redirect
syntax.

Collection fields are required by default; only values that may be absent use
the bare `optional` modifier. Storage and seed data are implementation choices.

## Acceptance Scenarios

1. Opening `/` redirects to `/contacts`.
2. Opening `/contacts` without an `id` asks the user to select a contact.
3. Opening `/contacts?id=ada` shows Ada's name, email, and active status.
4. Opening `/contacts?id=grace` shows email as unavailable and inactive status.
5. Opening `/contacts?id=unknown` says that the contact was not found.
