# Adding Screens

A screen gives an interface an addressable or conceptual destination. Every
Surface file needs at least one screen.

```kdl
interface "helloWorld" {
    context "Render a user interface with the exact text: Hello, world!"
}

screen "home" route="/" {
    use (interface)"helloWorld"
}
```

## Screen

`"home"` is the screen ID. It starts with a lowercase letter, should use lower
camel case, and must be unique among screens.

`route` is optional. Use it for a URL or similar address and omit it for a
screen that is not independently addressable:

```kdl
screen "contact" {
    use (interface)"contactViewer"
}
```

A visual screen uses exactly one checked interface reference:

```kdl
use (interface)"contactViewer"
```

The annotation and target are validated. Surface reports an error when the
interface does not exist, when the annotation is missing, or when it names a
different declaration type.

Screens do not contain presentation nodes. Layout, copy, controls, and UI
states belong in the referenced interface's prompt context.

## Context-Only Screens

A screen can contain only context when its route has no interface of its own:

```kdl
screen "home" route="/" {
    context (screen)"contact" "Redirect to this screen."
}
```

This describes non-visual behaviour without introducing redirect or logic
syntax. A screen must either use an interface or contain at least one context;
a completely empty screen is invalid.
