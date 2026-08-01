# Adding Ordered Logic

`logic` describes ordered, normative instructions for a `function`,
`interface`, or `screen`:

```kdl
logic "Use / as this screen's URL path."
```

Use this inline form for one unreferenced instruction. Use a block for multiple
instructions or checked references:

```kdl
logic {
    "Map over the input items."
    (collection)"contact" "If the active value is true, keep this item."
    "If the HTTP request fails, output an error."
}
```

The instructions run in source order. Unlike [`context`](./node_context.md),
logic is included in the semantic JSON IR because its order and meaning are
part of the application contract.

## Instructions

A plain instruction is a quoted node name with no arguments:

```kdl
"Remove empty items."
```

An instruction can instead attach one visible Surface declaration as a checked
reference. The reference is the annotated node name and the instruction is its
one quoted argument:

```kdl
(collection)"contact" "If the value is greater than 10, keep it."
```

The supported reference types are `application`, `collection`, `function`,
`interface`, and `screen`. Logic in a function can also see that function's
private collections.

## Keep Operators in Strings

Write conditions, comparisons, arithmetic, HTTP requests, event operations,
and errors as natural-language instruction strings:

```kdl
logic {
    "Send an HTTP GET request to the configured URL."
    "If the response status is greater than or equal to 400, output an error."
    "When the response succeeds, emit the loaded event."
}
```

Do not create `if`, `else`, `expression`, `operator`, `request`, `emit`,
`error`, or `step` child nodes. Those words have meaning inside the strings,
not as Surface grammar.

Each function, interface, or screen may contain at most one non-empty `logic`
node. Inline logic takes exactly one unannotated string. Block instructions
cannot have properties or child blocks. Use `context` for advice whose order
and exact outcome are not normative.
