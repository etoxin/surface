# Defining Data

A collection describes one kind of information used by the application. For example:

```kdl
collection "contact" {
    (string)"id"
    (string)"name"
    (string)"email" optional
    (boolean)"active"
}
```

## Collection

`"contact"` is the collection ID. It starts with a lowercase letter and should
use lower camel case. Each collection needs a different ID.

A collection contains one or more typed field nodes and can contain prompt-only
[`context`](./node_context.md). It has no properties.

## Field

A field describes one value on the collection:

```kdl
(string)"name"
```

`(string)` is a KDL node annotation that declares the field's portable type.
`"name"` is the field's node name. Field names use the same lower-camel-case
rule as declaration IDs and must be unique within their collection.

Every field needs one supported annotation. See [Portable types](./primitives.md)
for the complete set, including numbers, dates, arrays, objects, sets, and maps.

## Field Modifiers

Fields are required by default. Add the bare `optional` modifier only when a
collection can omit the value:

```kdl
(string)"email" optional
```

Do not write `required`; leaving out `optional` already means required. The
`optional` modifier takes no value and cannot be repeated. The earlier
`field "name" type="string"`, `required`, and `generated` syntax is not
supported.

A field can also contain prompt-only context:

```kdl
(string)"email" optional {
    context "Use this address only to display contact details."
}
```

## Collections Shared by Functions

A global collection can be the input and output contract for several functions.
The Todo List uses one contract for every task operation:

```kdl
collection "todo" {
    (string)"id"
    (string)"text"
    (enum)"status" (value)"todoStatus"
    (date)"dueDate" optional
    (number)"priority"
    (array)"tags" optional
}
```

The checked value reference restricts `status` to the options declared by the
[`(enum)value`](./node_value.md).
