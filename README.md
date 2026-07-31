# Surface

Surface is a small, human- and LLM-readable specification format for describing
an application without choosing its implementation framework.

**Status:** draft · **Version:** 0.1 · **Syntax:** KDL 2 · **Extension:** `.kdl`

The format grows one example application at a time. Surface 0.1 currently
contains the syntax needed for the first three roadmap rungs: Hello World,
Static FAQ, and Contact Viewer. See
[roadmap.md](./roadmap.md) for what comes next and the
[writing guide](./docs/README.md) for the complete released syntax.

## Example

```kdl
/- kdl-version 2

surface "0.1"

application "helloWorld" {
    purpose "Display a greeting."
}

screen "home" route="/" {
    section "Home" {
        context "This section contains the text Hello, world!"
        title "My app"
        text "Hello, world!"
    }
}
```

This describes one application with one screen at `/`. Its `Home` section has a
title and one text block.

## Documentation

Read the guides in this order:

1. [Writing Surface](./docs/README.md) — a complete example and how the pieces
   fit together
2. [Starting a Surface file](./docs/node_surface.md) — the KDL marker and
   `surface` declaration
3. [Describing the application](./docs/node_application.md) — application IDs
   and purpose
4. [Defining data](./docs/node_entity.md) — entities, typed fields, and Boolean
   properties
5. [Looking up data](./docs/node_query.md) — query inputs, return types, and
   references
6. [Adding screens and text](./docs/node_screen.md) — content, field references,
   and screen states
7. [Adding prompt context](./docs/node_context.md) — guidance for an LLM or
   implementer

## Surface 0.1

| Form | Rule |
| --- | --- |
| `surface "0.1"` | First semantic node; exactly one |
| `application "<id>"` | Exactly one; contains one `purpose` |
| `purpose "<text>"` | Child of `application`; exactly one string |
| `entity "<id>"` | Declares one or more typed `field` nodes |
| `field "<name>" type="<type>"` | Declares entity data; supports `generated` and `optional` Booleans |
| `query "<id>" by="<field>"` | Looks up one entity using `input` and `returns` children |
| `input "<name>" type="<type>"` | Declares a query input |
| `returns "<entity>" missing=#null` | Declares the returned entity and missing result |
| `screen "<id>" [route="<route>"] [query="<query>"]` | At least one; contains sections and queried-screen states |
| `section "<name>"` | Contains an optional `title` and one or more `text` or `field` nodes |
| `field "<name>"` | In a section, refers to a field returned by the screen query |
| `state "empty"|"notFound"` | Required alternatives for queried screens |
| `title "<text>"` | Optional child of `section`; at most one |
| `text "<text>"` | Child of `section`; one or more, in presentation order |
| `context "<prompt>"` | Optional, repeatable child of any Surface node; prompt-only |

Additional rules:

- Files start with `/- kdl-version 2` and contain valid KDL 2.
- Identifiers match `[a-z][A-Za-z0-9]*`, are case-sensitive, and should use
  lower camel case.
- Declaration identifiers and nested field/input names are unique within their
  type and scope.
- Field and input types are currently `string` or `boolean`.
- KDL 2 Boolean and null literals use `#true`, `#false`, and `#null`.
- Entity, query, and projected field references must resolve.
- A section uses either ordered text or ordered field references, not both.
- Routes are optional strings and currently opaque. Section names, titles, and
  text are strings.
- Sections and their text remain in source order.
- Triple-quoted KDL strings can hold multiline natural-language content.
- `context` contains one string, has no properties or children, and is omitted
  from the semantic JSON IR.
- Unknown nodes, properties, duplicate properties, and unsupported type
  annotations are rejected.
- Comments are supported and preserved by the formatter.
- Canonical formatting uses quoted strings, four-space indentation, one node
  per line, a blank line between top-level declarations, and a final newline.

A project currently contains one Surface `.kdl` file. The extension identifies
KDL, while the `surface` node identifies Surface. Imports and multi-file
projects are not yet supported.

## Tooling

[mise](https://mise.jdx.dev/) installs the pinned Deno version and runs the
project tasks:

```sh
mise install
mise run verify
```

Useful commands:

```sh
mise run format
mise run typecheck
mise run test
mise run surf check examples/01-hello-world/surface.kdl
mise run surf export examples/03-contact-viewer/surface.kdl --format json
```

Run `mise tasks` to see every task. `mise run verify` checks formatting, linting,
types, tests, fixtures, skill metadata, and repository consistency. The
equivalent direct Deno entry points are `deno task verify` and `deno task surf`.
Deno resolves the dependencies pinned in `deno.json` and `deno.lock`; no
separate package-manager install is needed.

The CLI supports:

```text
surf parse <file.kdl>
surf check <file.kdl>
surf format <file.kdl>
surf export <file.kdl> --format json
```

## Rung 1

- [Writing guide](./docs/README.md)
- [Surface example](./examples/01-hello-world/surface.kdl)
- [Expected JSON representation](./examples/01-hello-world/expected-ir.json)
- [Invalid examples](./examples/01-hello-world/invalid/)
- [Implemented page](./examples/01-hello-world/app/index.html)
- [LLM skill](./skills/surface/SKILL.md)

## Rung 2

- [Static FAQ specification](./examples/02-static-faq/surface.kdl)
- [Expected JSON representation](./examples/02-static-faq/expected-ir.json)
- [Invalid examples](./examples/02-static-faq/invalid/)
- [Implemented FAQ page](./examples/02-static-faq/app/index.html)
- [Decisions and acceptance scenario](./examples/02-static-faq/decisions.md)
- [Writing FAQs with sections](./docs/node_screen.md#building-an-faq)

## Rung 3

- [Contact Viewer specification](./examples/03-contact-viewer/surface.kdl)
- [Expected JSON representation](./examples/03-contact-viewer/expected-ir.json)
- [Invalid examples](./examples/03-contact-viewer/invalid/)
- [Deno Contact Viewer app](./examples/03-contact-viewer/app/server.ts)
- [Decisions and acceptance scenarios](./examples/03-contact-viewer/decisions.md)
- [Entity guide](./docs/node_entity.md)
- [Query guide](./docs/node_query.md)

Run it with `mise run contact-viewer`, then open
`http://localhost:8000/contacts?id=ada`.

Only the syntax documented above is released. Later concepts—including
behavior, components, workflows, integrations, and deployment—will be added
only when a roadmap application requires them. Each rung also updates and tests
the LLM skill.
