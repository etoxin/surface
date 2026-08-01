# Adding Prompt Context

`context` is a note for an LLM or a person implementing the application. It
explains how to interpret the node that contains it.

```kdl
section "Home" {
    context "Keep this section welcoming and concise."
    text "Hello, world!"
}
```

Context is unstructured prompt guidance. It is omitted from the semantic JSON
IR, but an implementer can use it to decide application behavior. If users
should see some text, use a `title` or `text` instead.

## Where Context Can Go

You can put context inside:

- `surface`;
- `application`;
- `purpose`;
- `entity`;
- entity `field` declarations;
- `query`;
- `input`;
- `returns`;
- `screen`;
- `use`;
- `section`;
- section `field` references;
- `state`;
- `title`;
- `text`.

Place it as close as possible to the thing it describes:

```kdl
application "helloWorld" {
    context "This application is intended for first-time Surface users."
    purpose "Display a greeting."
}

screen "home" {
    section "Home" {
        title "My app" {
            context "Use this as the main heading."
        }
        text "Hello, world!"
    }
}
```

## Referencing Declarations

Put zero or more typed references before the prompt when the guidance mentions
other Surface declarations:

```kdl
screen "home" route="/" {
    context (screen)"contact" "Redirect to this screen."
}
```

The annotated strings are checked references. Context can reference global
applications, entities, queries, and screens. Context inside a query can also
reference that query's private entities. Every reference must be visible in
the current scope and have the annotated declaration type.

Several references can share one prompt:

```kdl
context (entity)"contact" (query)"contactById" "Use this query to load this entity."
```

The final argument is always one unannotated quoted prompt. All earlier
arguments must be annotated string references. You can add several context
notes to the same parent. Context has no properties or child block, and its
prompt and references are omitted from the semantic JSON IR.
