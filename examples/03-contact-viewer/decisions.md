# Contact Viewer Decisions

## Lookup

`contactById` declares a private `contactLookup` input entity and returns the
global `contact` entity. Typed string annotations make both references
checkable. Context explains the lookup and says a failed lookup returns null.

The example implementation maps `/contacts?id=ada` to the input entity's `id`
field. That URL mapping is an implementation choice, not Surface syntax.

## Interface and Screens

`contactViewer` is an intent-driven interface. Its contexts reference the
function and entity while describing the input, displayed contact fields, and
missing input/result behavior. Surface leaves the exact controls, copy, and
layout to the implementer.

The `contact` screen uses that interface. The context-only `home` screen says
that `/` redirects to the checked `(screen)"contact"` reference without adding
structured redirect or logic syntax.

Entity fields are required by default; only values that may be absent use the
bare `optional` modifier. Storage and seed data are implementation choices.

## Acceptance Scenarios

1. Opening `/` redirects to `/contacts`.
2. Opening `/contacts` without an `id` asks the user to select a contact.
3. Opening `/contacts?id=ada` shows Ada's name, email, and active status.
4. Opening `/contacts?id=grace` shows email as unavailable and inactive status.
5. Opening `/contacts?id=unknown` says that the contact was not found.
