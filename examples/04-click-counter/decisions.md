# Click Counter Decisions

## Reusing Current Syntax

The Click Counter uses only `application`, `interface`, `screen`, `use`, and
`context`. Its value is local interface state rather than application data that
must be shared through a collection or function.

The interface context describes the initial value, visible output, increment
action, reset action, and required updates precisely enough to implement and
test the app. Rung 4 therefore introduces no new Surface syntax.

`actor`, `behaviour`, `event`, `scenario`, numeric field types, structured
state, preconditions, and effects remain unreleased. Add one only when a later
application exposes a concrete ambiguity or validation gap that context cannot
resolve.

## Implementation

The example uses a Deno TypeScript server and standard HTML forms, with no
client-side JavaScript. The current count is carried in the URL so the server
does not need shared process state. That mechanism is an implementation choice,
not Surface syntax.

Invalid or unsafe count values fall back to 0. The displayed value uses an
`aria-live` output so assistive technology can announce updates.

## Acceptance Scenarios

1. Opening `/` displays a current value of 0.
2. Choosing Increment from 0 displays 1.
3. Choosing Increment from 4 displays 5.
4. Choosing Reset from any value displays 0.
5. The Increment and Reset actions are clearly labelled.
6. Invalid, negative, or unsafe URL values display 0.
