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

screen "home" {
    use (interface)"helloWorld"
}
```

The main declarations are:

```text
Surface file
├── application
│   └── purpose
├── value
│   └── enum options (for enum values)
├── collection
│   └── typed fields
├── function
│   ├── private collection (optional)
│   ├── input (optional)
│   ├── output
│   └── logic (optional)
├── interface
│   ├── context
│   └── logic (optional)
└── screen
    ├── use (optional interface reference)
    ├── context
    └── logic (optional)
```

Read the guides in order:

1. [Starting a Surface file](./node_surface.md)
2. [Describing the application](./node_application.md)
3. [Portable types](./primitives.md)
4. [Defining values and enums](./node_value.md)
5. [Defining data](./node_collection.md)
6. [Defining functions](./node_function.md)
7. [Describing an interface](./node_interface.md)
8. [Adding screens](./node_screen.md)
9. [Adding prompt context](./node_context.md)
10. [Adding ordered logic](./node_logic.md)

Declaration IDs and field names start with a lowercase letter and use lower
camel case, such as `contactViewer`. Purpose, context prompts, and logic
instructions are ordinary quoted strings.

Surface currently supports applications, typed values, read-only collections,
single-collection functions, intent-driven interfaces, screens, and ordered
logic for computations and interactions. The [roadmap](../roadmap.md) adds
syntax only when another example application needs it.
