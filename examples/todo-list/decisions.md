# Todo List Decisions

## Declaring the Technology Stack

The application declares one `web` stack targeting the browser. Its technology
entries make the example's HTML, CSS, JavaScript, in-memory storage, and
single-file packaging explicit. These are implementation constraints rather
than framework-specific Surface nodes. Deno remains only a local file server,
so it is not part of the delivered application's stack.

## Adding Values and Portable Types

The Todo List introduces the `value` declaration. `defaultPriority` is a number
constant, `todos` is an array variable, and `(enum)value "todoStatus"` is the
closed set `open`, `completed`, and `archived`. The `(enum)"status"` field uses
a checked `(value)"todoStatus"` reference, so tools can verify its domain.

The collection also exercises `date`, `number`, and `array` fields for a due
date, priority, and tags. Surface records portable types and leaves their
language-specific representation to the implementation.

The application also reuses the released `collection` and `function` syntax.
The global `todo` collection is the shared contract for a task. A private
`todoInput` collection gives `createTodo` only the text supplied by the user.
The four functions describe independently callable task operations.

The interface retains the current list of todos and invokes those functions in
response to user actions. Its own logic remains responsible for initial state,
errors, exclusive grouping, and count updates. This separates task operations
from presentation without prescribing storage.

The enum value describes valid statuses, but does not define transitions
between them. `workflow`, `state`, and `transition` declarations remain
unreleased; ordered function logic is sufficient for this application.

## Implementation

The example is one self-contained HTML file with embedded CSS and JavaScript.
It keeps tasks in browser memory and resets when the page reloads. Deno is used
only by the repository task that serves the file locally.

Each task has exactly one implementation status: `open`, `completed`, or
`archived`. Invalid actions leave the list unchanged. Blank task text produces
an inline validation error. Its four JavaScript functions correspond directly
to the four Surface functions.

## Acceptance Scenarios

1. Opening `/` shows empty Open, Completed, and Archived groups with zero counts.
2. Adding non-empty text creates one Open task and clears the input.
3. Adding only whitespace shows an error and creates no task.
4. Completing an Open task moves it to Completed.
5. Reopening a Completed task moves it back to Open.
6. Archiving a Completed task moves it to Archived.
7. Reopening an Archived task moves it back to Open.
8. Every task appears in exactly one group and every group count stays current.
