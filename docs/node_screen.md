# Adding Screens

A screen gives an interface an addressable or conceptual destination. Every
Surface file needs at least one screen.

```kdl
interface "helloWorld" {
    context "Render a user interface with the exact text: Hello, world!"
}

screen "home" {
    use (interface)"helloWorld"
}
```

## Screen

`"home"` is the screen ID. It starts with a lowercase letter, should use lower
camel case, and must be unique among screens.

Screens have no properties. When a screen needs a URL or similar address,
describe it with inline [`logic`](./node_logic.md):

```kdl
screen "contact" {
    use (interface)"contactViewer"
    logic "Use /contacts as this screen's URL path."
}
```

Do not write `route="/contacts"`; `route` is legacy syntax.

A visual screen uses exactly one checked interface reference:

```kdl
use (interface)"contactViewer"
```

The annotation and target are validated. Surface reports an error when the
interface does not exist, when the annotation is missing, or when it names a
different declaration type.

Screens do not contain presentation nodes. Layout, copy, controls, and UI
states belong in the referenced interface's prompt context.

## Non-Visual Screens

A screen can contain logic when it has no interface of its own:

```kdl
screen "home" {
    logic {
        "Use / as this screen's URL path."
        (screen)"contact" "Open this screen."
    }
}
```

This gives the screen ordered, normative instructions without introducing a
special redirect node or route property. Screens may contain `context`, at most
one [`logic`](./node_logic.md) node, or both. A screen must use an interface or
contain context or logic; a completely empty screen is invalid.
