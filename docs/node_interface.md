# Rendering a User Interface

An `interface` declares that an application must render a visible, usable user
interface. Surface deliberately does not prescribe its layout, controls, or
markup.

```kdl
interface "helloWorld" {
    context "Render a user interface with the exact text: Hello, world!"
}
```

`"helloWorld"` is the interface ID. It must start with a lowercase letter and
use lower camel case. Interface IDs are unique among interfaces.

An interface has no properties. Add [`context`](./node_context.md) to describe
what users should see and add an optional [`logic`](./node_logic.md) block for
ordered interactions and reactions. The implementing person or LLM chooses
suitable text, layout, inputs, buttons, selectors, accessibility, and
responsive behaviour.

Use typed references when the interface depends on declared data or functions:

```kdl
interface "contactViewer" {
    context (function)"contactById" (collection)"contact" "Render a user interface that finds and displays a contact."
    logic {
        (function)"contactById" "When no contact matches, show that the contact was not found."
    }
}
```

Surface does not define section, title, text, field, input, button, selector,
component, or other UI nodes. Interface children are limited to `context` and
at most one `logic` block.

A screen renders an interface through a checked reference:

```kdl
screen "contact" route="/contacts" {
    use (interface)"contactViewer"
}
```

## Interactive Interfaces

Use context for presentation guidance and logic for ordered interaction.
Required conditional reactions—such as “when this happens, show that”—belong
in logic even when their outcome is visual:

```kdl
interface "clickCounter" {
    context "Render an accessible counter with its current value shown prominently."

    logic {
        "Start the current value at 0."
        "When Increment is activated, increase the current value by 1."
        "When Reset is activated, set the current value to 0."
        "After either action, immediately display the current value."
    }
}
```

Do not add collections, functions, or speculative behaviour and event syntax
solely to represent interface-local state. Keep conditions, arithmetic, event
wording, and other operators inside the logic instruction strings.
