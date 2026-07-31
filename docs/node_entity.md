# Defining Data

An entity describes one kind of information used by the application. The
Contact Viewer needs a contact:

```kdl
entity "contact" {
    field "id" type="string" generated=#true
    field "name" type="string"
    field "email" type="string" optional=#true
    field "active" type="boolean"
}
```

## Entity

`"contact"` is the entity ID. It starts with a lowercase letter and should
use lower camel case. Each entity needs a different ID.

An entity contains one or more `field` nodes and can contain prompt-only
[`context`](./node_context.md). It has no properties.

## Field

A field describes one value on the entity:

```kdl
field "name" type="string"
```

`"name"` is the field name. Field names use the same lower-camel-case rule as
declaration IDs and must be unique within their entity.

Every field needs a `type`. Surface currently supports:

- `type="string"` for text;
- `type="boolean"` for true-or-false values.

Numbers are not supported yet.

## Generated and Optional Fields

Use `generated=#true` when the application creates a field value rather than
asking a user or external source to provide it:

```kdl
field "id" type="string" generated=#true
```

Use `optional=#true` when an entity can exist without the field:

```kdl
field "email" type="string" optional=#true
```

`generated` and `optional` are Boolean properties, so use the KDL 2
literals `#true` and `#false`, without quotes. Quoted values such as
`"true"` are text and are invalid here.

A field can also contain prompt-only context:

```kdl
field "email" type="string" optional=#true {
    context "Use this address only to display contact details."
}
```
