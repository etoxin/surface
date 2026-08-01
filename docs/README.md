# Writing Surface

Surface is a small KDL vocabulary for describing an application, including optional
technology choices, without prescribing detailed UI syntax.

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
│   ├── purpose
│   └── stack (optional, repeatable)
│       ├── target
│       └── technology
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
3. [Surface 0.1 grammar](./grammar.md)
4. [Choosing the technology stack](./node_stack.md)
5. [Portable types](./primitives.md)
6. [Defining values and enums](./node_value.md)
7. [Defining data](./node_collection.md)
8. [Defining functions](./node_function.md)
9. [Describing an interface](./node_interface.md)
10. [Adding screens](./node_screen.md)
11. [Adding prompt context](./node_context.md)
12. [Adding ordered logic](./node_logic.md)

Declaration IDs and field names start with a lowercase letter and use lower camel case,
such as `contactViewer`. Purpose, context prompts, and logic instructions are ordinary
quoted strings.

Surface currently supports applications with explicit technology stacks, typed values,
read-only collections, single-collection functions, intent-driven interfaces, screens,
and ordered logic for computations and interactions. The [roadmap](../roadmap.md) tests
this frozen language through applications. Missing capabilities are evidence for a later
version rather than additions to 0.1.
