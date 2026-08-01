# Adding Prompt Context

`context` is guidance for the LLM or person implementing its parent node:

```kdl
interface "helloWorld" {
    context "Render a welcoming interface with the exact text: Hello, world!"
}
```

Context describes intent and behaviour. It is preserved in the Surface source
but omitted from the reduced semantic JSON IR.

## Where Context Can Go

Context is universal. It can be added to `surface`, `application`, `purpose`,
collections and their fields, functions and their private collections, `input`,
`output`, `interface`, `screen`, and `use`.

Place it as close as possible to what it explains:

```kdl
application "helloWorld" {
    purpose "Display a greeting." {
        context "Do not add navigation or secondary actions."
    }
}
```

## Referencing Declarations

Put typed references before the prompt when the guidance relates declarations:

```kdl
context (function)"contactById" (collection)"contact" "Display the returned contact."
```

A type annotation on a string means that the string references another Surface
declaration. Context can reference global applications, collections, interfaces,
functions, and screens. Context inside a function can also reference one of
that function's private collections. Every reference is checked for visibility
and type.

Use the CLI to discover exact references:

```sh
surf reference surface.kdl --list
surf reference surface.kdl interface.contactViewer
```

The last argument is exactly one unannotated prompt string. Any earlier
arguments are annotated string references. A context node has no properties or
children, and a parent may contain several context nodes.
