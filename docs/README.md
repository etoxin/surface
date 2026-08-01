# Writing Surface

Surface is a small KDL vocabulary for describing an application without
choosing its framework or detailed UI syntax.

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

The main declarations are:

```text
Surface file
├── application
│   └── purpose
├── entity
│   └── typed fields
├── function
│   ├── private entity (optional)
│   ├── input (optional)
│   └── returns
├── interface
│   └── context
└── screen
    ├── use (optional interface reference)
    └── context
```

Read the guides in order:

1. [Starting a Surface file](./node_surface.md)
2. [Describing the application](./node_application.md)
3. [Defining data](./node_entity.md)
4. [Defining functions](./node_function.md)
5. [Describing an interface](./node_interface.md)
6. [Adding screens](./node_screen.md)
7. [Adding prompt context](./node_context.md)

Declaration IDs and field names start with a lowercase letter and use lower
camel case, such as `contactViewer`. Purpose, routes, and context prompts are
ordinary quoted strings.

Surface currently supports applications, read-only entities, single-entity
functions, intent-driven interfaces, and screens. The [roadmap](../roadmap.md)
adds syntax only when another example application needs it.
