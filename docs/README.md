# Writing Surface

Surface files describe an application in a way that is easy to read before
choosing how to build it. The current version is intentionally small: it can
describe an application made of screens and ordered text.

## A Complete Example

```kdl
/- kdl-version 2

surface "0.1"

application "helloWorld" {
    purpose "Display a greeting."
}

screen "home" route="/" {
    section "Home" {
        context "Keep this section welcoming and concise."
        title "My app"
        text "Hello, world!"
    }
}
```

Copy the KDL marker and `surface` declaration exactly as shown. They tell KDL
and Surface how to read the file.

## How the Pieces Fit

```text
Surface file
├── application
│   └── purpose
├── entity
│   └── field
├── query
│   ├── input
│   └── returns
└── screen
    ├── section
    │   ├── title (optional)
    │   ├── text
    │   └── field reference
    └── state
        └── section
```

You can add a prompt-only `context` note inside any of these nodes.

Continue with:

- [Starting a Surface file](./node_surface.md)
- [Describing the application](./node_application.md)
- [Defining data](./node_entity.md)
- [Looking up data](./node_query.md)
- [Adding screens and text](./node_screen.md)
- [Adding prompt context](./node_context.md)

## Naming Things

Applications, entities, queries, screens, fields, and inputs have IDs or names
such as `helloWorld` and `contactById`. Start one with a lowercase letter
and use lower camel case for multiple words: `contactViewer`, not
`ContactViewer` or `contact-viewer`.

Section names, titles, text, purposes, routes, and context are ordinary
quoted text.

## What Surface Supports Today

A file contains one application and at least one screen. It can describe
read-only entities and single-entity lookups. Imports, actions, components, and
other planned features are not available yet. The [roadmap](../roadmap.md)
shows when those ideas will be introduced.
