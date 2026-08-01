# Surface

Surface is a small KDL format for describing an application without prescribing its
implementation. It gives humans and LLMs a shared, checked product specification: data,
capabilities, interfaces, screens, technology choices, context, and ordered logic.

**Status:** experimental · **Format:** Surface 0.1 · **Syntax:** KDL 2 · **Extension:**
`.kdl` · **Grammar:** frozen

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

Surface is not a source-code generator. Its CLI checks, formats, exports, and resolves
references in a specification. Give the checked `.kdl` file and the included Surface
skill to an LLM—or to a person—to produce the application.

## Try Surface

Install [mise](https://mise.jdx.dev/), then run:

```sh
git clone https://github.com/etoxin/surface-lang.git
cd surface-lang
mise install
mise run surf check examples/hello-world/surface.kdl
mise run surf export examples/hello-world/surface.kdl --format json
mise run verify
```

Start with [Getting started](./docs/getting_started.md) to write and implement your own
specification. Surface is experimental, so keep the `.kdl` source and generated code in
version control and review generated applications before using them.

## Documentation

| Guide | Purpose |
| --- | --- |
| [Writing Surface](./docs/README.md) | Documentation overview and language shape |
| [Getting started](./docs/getting_started.md) | Install, write, validate, and implement a first app |
| [Generating applications](./docs/generating_applications.md) | Give a Surface specification to an LLM reproducibly |
| [Testing and reporting](./docs/testing.md) | Test implementations and report useful evidence |
| [Surface 0.1 grammar](./docs/grammar.md) | Complete authoritative language reference |
| [Starting a Surface file](./docs/node_surface.md) | File marker and format version |
| [Application](./docs/node_application.md) | Application identity and purpose |
| [Technology stacks](./docs/node_stack.md) | Targets, technologies, versions, and design systems |
| [Portable types](./docs/primitives.md) | Language-neutral type annotations |
| [Values and enums](./docs/node_value.md) | Constants, variables, and enum values |
| [Collections](./docs/node_collection.md) | Typed data shapes |
| [Functions](./docs/node_function.md) | Inputs, outputs, private collections, and capabilities |
| [Interfaces](./docs/node_interface.md) | Intent-driven user interfaces |
| [Screens](./docs/node_screen.md) | Interface placement and navigation intent |
| [Context](./docs/node_context.md) | Prompt guidance and checked references |
| [Logic](./docs/node_logic.md) | Ordered normative instructions |

## Examples and Evidence

Four examples cover the small language from first use through platform-scale tests:

- [Hello World](./examples/hello-world/README.md)
- [Todo List](./examples/todo-list/README.md)
- [Online Checkout](./examples/online-checkout/README.md)
- [Multi-tenant Project Tracker](./examples/multi-tenant-project-tracker/README.md)

Online Checkout and Multi-tenant Project Tracker pin Pico CSS 2.1.1 in their
application stacks and test the frozen grammar at platform scale.

## CLI

```text
mise run surf parse <file.kdl>
mise run surf check <file.kdl>
mise run surf format <file.kdl>
mise run surf export <file.kdl> --format json
mise run surf reference <file.kdl> <selector|--list>
```

Run `mise tasks` to see every example task. The complete repository check is
`mise run verify`.

Surface 0.1 is frozen. Bug fixes, diagnostics, formatting, documentation, and tooling may
improve, but new valid syntax belongs to a later format version.
