# Surface Language

Surface is a small, human- and LLM-readable language for describing an
application without choosing its implementation framework.

**Status:** draft · **Version:** 0.1 · **Syntax:** KDL 2 · **Extension:** `.kdl`

The language grows one example application at a time. Surface 0.1 contains only
the syntax needed for the first roadmap rung: Hello World. See
[roadmap.md](./roadmap.md) for what comes next.

## Example

```kdl
/- kdl-version 2

surface-lang "0.1"

application "helloWorld" version="0.1.0" {
    purpose "Display a greeting."
}

screen "home" route="/" {
    section "Hello, world!"
}
```

This describes one application with one screen at `/` and one section showing
`Hello, world!`.

## Surface 0.1

| Form | Rule |
| --- | --- |
| `surface-lang "0.1"` | First semantic node; exactly one |
| `application "<id>" version="<version>"` | Exactly one; contains one `purpose` |
| `purpose "<text>"` | Child of `application`; exactly one string |
| `screen "<id>" route="<route>"` | At least one; contains one or more `section` nodes |
| `section "<text>"` | Child of `screen`; order is preserved |

Additional rules:

- Files start with `/- kdl-version 2` and contain valid KDL 2.
- Identifiers match `[a-z][A-Za-z0-9]*`, are case-sensitive, and should use
  lower camel case.
- Application and screen identifiers are unique within their declaration type.
- Versions, routes, and text are strings. Routes are currently opaque.
- Unknown nodes, properties, duplicate properties, and unsupported type
  annotations are rejected.
- Comments are supported and preserved by the formatter.
- Canonical formatting uses quoted strings, four-space indentation, one node
  per line, a blank line between top-level declarations, and a final newline.

A project currently contains one Surface `.kdl` file. The extension identifies
KDL, while the `surface-lang` node identifies Surface. Imports and multi-file
projects are not yet supported.

## Tooling

[mise](https://mise.jdx.dev/) installs the pinned Deno version and runs the
project tasks:

```sh
mise install
mise run check
```

Useful commands:

```sh
mise run format
mise run test
mise run surf check examples/01-hello-world/surface.kdl
mise run surf export examples/01-hello-world/surface.kdl --format json
```

Run `mise tasks` to see every task. The equivalent direct Deno entry points are
`deno task check` and `deno task surf`. Deno resolves the dependencies pinned in
`deno.json` and `deno.lock`; no separate package-manager install is needed.

The CLI supports:

```text
surf parse <file.kdl>
surf check <file.kdl>
surf format <file.kdl>
surf export <file.kdl> --format json
```

## Rung 1

- [Surface example](./examples/01-hello-world/surface.kdl)
- [Expected JSON representation](./examples/01-hello-world/expected-ir.json)
- [Invalid examples](./examples/01-hello-world/invalid/)
- [Implemented page](./examples/01-hello-world/app/index.html)
- [LLM skill](./skills/surface-language/SKILL.md)

Only the syntax documented above is released. Later concepts—including data,
behavior, components, workflows, integrations, and deployment—will be added
only when a roadmap application requires them. Each rung also updates and tests
the LLM skill.
