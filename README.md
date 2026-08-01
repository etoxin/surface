# Surface

Surface is a small, human- and LLM-readable KDL format for describing an application,
including optional technology choices, without prescribing detailed UI syntax.

**Status:** frozen grammar · **Version:** 0.1 · **Syntax:** KDL 2 · **Extension:**
`.kdl`

```kdl
/- kdl-version 2

surface "0.1"

application "helloWorld" {
    purpose "Display a greeting."
}

interface "helloWorld" {
    context "Render a user interface with the title My app and the exact text: Hello, world!"
}

screen "home" {
    use (interface)"helloWorld"
}
```

An `interface` uses context to describe what a user should see and logic for ordered
interaction. It does not prescribe sections, text nodes, buttons, inputs, or layout. A
`screen` places an interface in the application. Screens may instead contain context or
logic for non-visual behaviour.

## Documentation

1. [Writing Surface](./docs/README.md)
2. [Starting a Surface file](./docs/node_surface.md)
3. [Describing the application](./docs/node_application.md)
4. [Surface 0.1 grammar](./docs/grammar.md)
5. [Choosing the technology stack](./docs/node_stack.md)
6. [Portable types](./docs/primitives.md)
7. [Defining values and enums](./docs/node_value.md)
8. [Defining data](./docs/node_collection.md)
9. [Defining functions](./docs/node_function.md)
10. [Describing an interface](./docs/node_interface.md)
11. [Adding screens](./docs/node_screen.md)
12. [Adding prompt context](./docs/node_context.md)
13. [Adding ordered logic](./docs/node_logic.md)
14. [Application roadmap](./roadmap.md)

## Current Syntax

Surface 0.1 is frozen. Existing syntax may receive bug fixes and clearer documentation,
but new declarations, children, properties, modifiers, and reference types require a
later Surface version.

- A file starts with `/- kdl-version 2`, then one `surface "0.1"` and one `application`
  containing a `purpose`. Optional named `stack` nodes record each target and its
  open-ended technology choices.
- `(type)value "id"` declares a constant by default; a bare trailing `variable` marks
  mutable state. `(enum)value` contains unique quoted options.
- `collection` fields use the same portable type annotations as values. Fields are
  required by default; the only modifier is `optional`. An `(enum)` field has one
  checked `(value)"id"` reference.
- `function` describes a named capability. It currently has one
  `output (collection)"id"`, an optional structured `input`, and may declare
  function-private collections and one optional `logic` node.
- `interface "id"` contains universal `context` and optional `logic`.
- `screen "id"` contains either one `use (interface)"id"` plus optional context or
  logic, or non-visual context or logic alone. Screens have no properties; describe a
  URL path with logic when needed.
- `context [(type)"id"...] "prompt"` can be attached to any supported node. Its
  annotated strings are checked references to visible declarations.
- `logic` contains ordered instructions. Each instruction is a quoted string, optionally
  attached to one checked reference; a single instruction can use `logic "..."`.
  Operators stay inside strings.
- Declaration IDs and field names use lower camel case. Unknown or legacy syntax is
  rejected.

## Tooling

[mise](https://mise.jdx.dev/) installs the pinned Deno version and exposes the
repository tasks:

```sh
mise install
mise run verify
```

Useful commands:

```sh
mise run surf check examples/01-hello-world/surface.kdl
mise run surf format examples/01-hello-world/surface.kdl
mise run surf export examples/03-contact-viewer/surface.kdl --format json
mise run surf reference examples/03-contact-viewer/surface.kdl --list
mise run static-faq
mise run contact-viewer
mise run click-counter
mise run todo-list
mise run signup-determinism
mise run design-consistency
mise run design-visual
mise run url-shortener
mise run file-converter
INVENTORY_API_TOKEN=development PAYMENT_API_TOKEN=development mise run online-checkout
mise run multi-tenant-project-tracker
```

`design-visual` downloads its pinned Playwright Chromium browser on first use.

The direct equivalents are `deno task verify` and `deno task surf`. The CLI supports
`parse`, `check`, `format`, `export`, and `reference`. Reference selectors include
`interface.contactViewer`, `screen.contact`, and scoped private collections such as
`function.contactById.collection.contactLookup`. Values use selectors such as
`value.todoStatus`.

## Examples

### Completed rungs

- [Rung 1: Hello World](./examples/01-hello-world/surface.kdl)
- [Rung 2: Static FAQ](./examples/02-static-faq/surface.kdl)
- [Rung 3: Contact Viewer](./examples/03-contact-viewer/surface.kdl)
- [Rung 4: Click Counter](./examples/04-click-counter/surface.kdl)
- [Rung 5: Todo List](./examples/05-todo-list/surface.kdl)

Each completed rung includes expected JSON, invalid fixtures, a small implementation,
human documentation, and updates to the LLM skill.

### Candidate stress tests

- [Rung 6: Signup Determinism](./examples/06-signup-determinism/benchmark.md)
- [Rung 7: HTML Design Consistency](./examples/07-design-consistency/benchmark.md)
- [Rung 8: URL Shortener API](./examples/08-url-shortener-api/surface.kdl)
- [Rung 11: File Converter](./examples/11-file-converter/surface.kdl)
- [Rung 15: Online Checkout](./examples/15-online-checkout/surface.kdl)
- [Rung 16: Multi-tenant Project Tracker](./examples/16-multi-tenant-project-tracker/surface.kdl)

These candidates test whether released syntax can support later applications. They
include implementations and reviewed IR, but are not complete rung deliveries with
invalid fixtures, full human documentation, or skill updates.

The [LLM skill](./skills/surface/SKILL.md) covers the currently completed language
surface.

The Static FAQ runs at `http://localhost:8002/faq`; the Contact Viewer runs at
`http://localhost:8000/contacts?id=ada`; the Click Counter runs at
`http://localhost:8001/`; the self-contained Todo List HTML runs at
`http://localhost:8003/` through its convenience task. The URL Shortener API runs at
`http://localhost:8004/`, the File Converter at `http://localhost:8005/`, the Online
Checkout at `http://localhost:8006/checkout`, and the Multi-tenant Project Tracker at
`http://localhost:8007/`. The three signup builds run at `http://localhost:8010/`,
`http://localhost:8011/`, and `http://localhost:8012/`.
The three design-consistency builds run at `http://localhost:8020/`,
`http://localhost:8021/`, and `http://localhost:8022/`.

Surface 0.1 is frozen. Roadmap applications must use its documented grammar; missing
capabilities become evidence for a later language version rather than new 0.1 syntax.
