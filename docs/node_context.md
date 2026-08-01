# Adding Prompt Context

`context` is a note for an LLM or a person implementing the application. It
explains how to interpret the node that contains it.

```kdl
section "Home" {
    context "Keep this section welcoming and concise."
    text "Hello, world!"
}
```

Context is guidance only. It does not add visible text, behavior, or data to
the application. If users should see some text, use a `title` or `text`
instead.

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

You can add several context notes to the same parent. Each one takes exactly
one quoted prompt and has no properties. A `context` node cannot have its own
child block.
