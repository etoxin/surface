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

An interface has no properties or interface-specific child nodes. Add
[`context`](./node_context.md) to describe what users should see and be able to
do. The implementing person or LLM chooses suitable text, layout, inputs,
buttons, selectors, accessibility, and responsive behaviour.

Use typed references when the interface depends on declared data or functions:

```kdl
interface "contactViewer" {
    context (function)"contactById" (collection)"contact" "Render a user interface that finds and displays a contact."
    context (function)"contactById" "When no contact matches, show that the contact was not found."
}
```

Context is the only child currently supported by an interface. Surface does
not define section, title, text, field, input, button, selector, component, or
other UI nodes. Add structured interface syntax only when a later application
requires behaviour that prompt guidance cannot express reliably.

A screen renders an interface through a checked reference:

```kdl
screen "contact" route="/contacts" {
    use (interface)"contactViewer"
}
```

## Interactive Interfaces

Use context for local interaction when the required behaviour is unambiguous:

```kdl
interface "clickCounter" {
    context """
        Render an accessible counter starting at 0.
        Show the current value prominently.
        Provide an Increment action that increases the value by 1.
        Provide a Reset action that restores the value to 0.
        Update the displayed value immediately after either action.
        """
}
```

Do not add collections, functions, or speculative behaviour and event syntax
solely to represent interface-local state. Add structured declarations only
when the same requirement cannot be described and implemented reliably through
interface context.
