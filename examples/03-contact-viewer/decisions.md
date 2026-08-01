# Contact Viewer Decisions

## Lookup

A rung-3 query accepts zero or one entity-shaped input and returns one entity or
`#null`. `contactById` declares a private `contactLookup` input entity and returns the
global `contact` entity. Context explains that the input ID matches the contact ID.

Cross-declaration references use annotated strings. The query returns
`(entity)"contact"`, and the screen declares `use (query)"contactById"`. Surface checks
that each target exists and has the annotated declaration type.

A queried web screen receives input-entity fields from URL query parameters with the
same names. For this example, `/contacts?id=ada` supplies the private input entity's
`id` field.

## Display

A typed child node inside an entity declares data. A `field` inside a normal screen
section refers to a field on the entity returned by the screen's query. State sections
contain static titles and text because no entity is available.

Entity fields use KDL node annotations for their primitive types. Fields are required by
default, and only fields that may be absent use the bare `optional` modifier. Generation
is not described because this read-only application never creates contacts. Context
remains a child node so it stays repeatable and can contain multiline prompts.

The example stores two contacts in memory. Storage and seed data are implementation
choices and are not part of Surface yet.

## Acceptance Scenarios

1. Opening `/contacts` without an `id` shows the empty state.
2. Opening `/contacts?id=ada` shows Ada's name, email, and active status.
3. Opening `/contacts?id=grace` shows the optional email as unavailable and the inactive
   Boolean state.
4. Opening `/contacts?id=unknown` shows the not-found state.
