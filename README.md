# Surface

Surface is a small, human- and LLM-readable KDL format for describing an
application without choosing its framework or detailed UI syntax.

**Status:** draft · **Version:** 0.1 · **Syntax:** KDL 2 · **Extension:** `.kdl`

```kdl
/- kdl-version 2

surface "0.1"

application "helloWorld" {
    purpose "Display a greeting."
}

interface "helloWorld" {
    context "Render a user interface with the title My app and the exact text: Hello, world!"
}

screen "home" route="/" {
    use (interface)"helloWorld"
}
```

An `interface` describes what a user should see or do through prompt context.
It does not prescribe sections, text nodes, buttons, inputs, or layout. A
`screen` places one interface at an optional route. Screens may instead contain
only context for non-visual behavior.

## Documentation

1. [Writing Surface](./docs/README.md)
2. [Starting a Surface file](./docs/node_surface.md)
3. [Describing the application](./docs/node_application.md)
4. [Defining data](./docs/node_entity.md)
5. [Looking up data](./docs/node_query.md)
6. [Describing an interface](./docs/node_interface.md)
7. [Adding screens](./docs/node_screen.md)
8. [Adding prompt context](./docs/node_context.md)
9. [Application roadmap](./roadmap.md)

## Current Syntax

- A file starts with `/- kdl-version 2`, then one `surface "0.1"` and one
  `application` containing a `purpose`.
- `entity` declares fields as `(string)"name"` or `(boolean)"active"`. Fields
  are required by default; the only modifier is `optional`.
- `query` has one `returns (entity)"id"`, an optional structured `input`, and
  may declare query-private entities.
- `interface "id"` contains only universal `context` nodes.
- `screen "id"` contains either one `use (interface)"id"` plus optional
  context, or context alone. Its `route` property is optional.
- `context [(type)"id"...] "prompt"` can be attached to any supported node.
  Its annotated strings are checked references to visible declarations.
- Declaration IDs and field names use lower camel case. Unknown or legacy
  syntax is rejected.

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
mise run contact-viewer
```

The direct equivalents are `deno task verify` and `deno task surf`. The CLI
supports `parse`, `check`, `format`, `export`, and `reference`. Reference
selectors include `interface.contactViewer`, `screen.contact`, and scoped
private entities such as `query.contactById.entity.contactLookup`.

## Examples

- [Rung 1: Hello World](./examples/01-hello-world/surface.kdl)
- [Rung 2: Static FAQ](./examples/02-static-faq/surface.kdl)
- [Rung 3: Contact Viewer](./examples/03-contact-viewer/surface.kdl)
- [LLM skill](./skills/surface/SKILL.md)

Each rung includes expected JSON, invalid fixtures, a small implementation,
human documentation, and updates to the LLM skill. Run the Contact Viewer and
open `http://localhost:8000/contacts?id=ada`.

Only the documented syntax is released. New syntax is added when a roadmap
application demonstrates that it is necessary.
