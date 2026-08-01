# Defining Data

An entity describes one kind of information used by the application. The
Contact Viewer needs a contact:

```kdl
entity "contact" {
    (string)"id" required generated
    (string)"name" required
    (string)"email" optional
    (boolean)"active" required
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
(string)"name" required
```

`(string)` is a KDL node annotation that declares the field's primitive type.
`"name"` is the field's node name. Field names use the same lower-camel-case
rule as declaration IDs and must be unique within their entity.

Every field needs one of these node annotations:

- `(string)` for text;
- `(boolean)` for true-or-false values.

Numbers are not supported yet.

## Field Modifiers

Every field must contain exactly one cardinality modifier:

- `required` means the entity must have a value;
- `optional` means the entity can omit the value.

Add `generated` after the cardinality when the application creates the value
rather than asking a user or external source to provide it:

```kdl
(string)"id" required generated
```

An optional field looks like:

```kdl
(string)"email" optional
```

Write modifiers as bare words without values. Do not combine `required` and
`optional`, repeat a modifier, or use forms such as `generated=#true`.

A field can also contain prompt-only context:

```kdl
(string)"email" optional {
    context "Use this address only to display contact details."
}
```
