# Defining Data

An entity describes one kind of information used by the application. The
Contact Viewer needs a contact:

```kdl
entity "contact" {
    (string)"id"
    (string)"name"
    (string)"email" optional
    (boolean)"active"
}
```

## Entity

`"contact"` is the entity ID. It starts with a lowercase letter and should
use lower camel case. Each entity needs a different ID.

An entity contains one or more typed field nodes and can contain prompt-only
[`context`](./node_context.md). It has no properties.

## Field

A field describes one value on the entity:

```kdl
(string)"name"
```

`(string)` is a KDL node annotation that declares the field's primitive type.
`"name"` is the field's node name. Field names use the same lower-camel-case
rule as declaration IDs and must be unique within their entity.

Every field needs one of these node annotations:

- `(string)` for text;
- `(boolean)` for true-or-false values.

Numbers are not supported yet.

## Field Modifiers

Fields are required by default. Add the bare `optional` modifier only when an
entity can omit the value:

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
