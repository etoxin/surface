# Writing Surface

Surface is a checked product specification written in KDL 2. The `.kdl` source records
what an application is for, the information it uses, its capabilities, what people
experience, and any intentional technology constraints. A person or LLM chooses the
implementation details.

Start with these guides:

1. [Getting started](./getting_started.md)
2. [Generating applications](./generating_applications.md)
3. [Testing and reporting](./testing.md)
4. [Surface 0.1 grammar](./grammar.md)

The language is deliberately small:

```text
Surface file
├── application
│   ├── purpose
│   └── stack (optional, repeatable)
│       ├── target
│       └── technology
├── value
├── collection
├── function
│   ├── private collection (optional)
│   ├── input (optional)
│   ├── output
│   └── logic (optional)
├── interface
│   ├── context
│   └── logic (optional)
└── screen
    ├── use (optional)
    ├── context
    └── logic (optional)
```

## Node Guides

- [Surface document](./node_surface.md)
- [Application and purpose](./node_application.md)
- [Technology stacks](./node_stack.md)
- [Portable types](./primitives.md)
- [Values and enums](./node_value.md)
- [Collections](./node_collection.md)
- [Functions](./node_function.md)
- [Interfaces](./node_interface.md)
- [Screens](./node_screen.md)
- [Context](./node_context.md)
- [Logic](./node_logic.md)

Declaration IDs and field names use lower camel case, such as `todoList`. Context is
prompt guidance. Logic is ordered, normative application behavior. Typed strings such as
`(function)"createTodo"` are checked references to declarations.

Surface 0.1 is frozen. If an application cannot be described clearly with the released
grammar, record the blocker instead of inventing syntax.
