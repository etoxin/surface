# Contact Viewer Decisions

## Lookup

A rung-3 query is a single-entity lookup. Its `by` property names both an input and a
field on the returned entity. Those two values must use the same primitive type.
`missing=#null` makes the not-found result explicit.

Cross-declaration references use annotated strings. The query returns
`(entity)"contact"`, and the screen declares `use (query)"contactById"`. Surface checks
that each target exists and has the annotated declaration type.

A queried web screen receives query inputs from URL query parameters with the same
names. For this example, `/contacts?id=ada` supplies the `id` input.

## Display

A `field` inside an entity declares data. A `field` inside a normal screen section
refers to a field on the entity returned by the screen's query. State sections contain
static titles and text because no entity is available.

Entity field types remain properties because a type has a value. Boolean-like field
traits are bare modifiers: `generated` and `optional`. Required is the default, so it
needs no modifier.

The example stores two contacts in memory. Storage and seed data are implementation
choices and are not part of Surface yet.

## Acceptance Scenarios

1. Opening `/contacts` without an `id` shows the empty state.
2. Opening `/contacts?id=ada` shows Ada's name, email, and active status.
3. Opening `/contacts?id=grace` shows the optional email as unavailable and the inactive
   Boolean state.
4. Opening `/contacts?id=unknown` shows the not-found state.
