# Defining Values

A `value` declares a named application constant or variable. Put its primitive
type annotation on the node:

```kdl
(number)value "defaultPriority" 1
(array)value "todos" variable
```

Values are constant by default. Add the bare `variable` modifier last when the
application may change the value. A directly representable KDL string, number,
Boolean, or null may appear after the ID as an initial value. Initial values are
optional because composite and runtime-provided values may instead be described
with [`context`](./node_context.md) and [`logic`](./node_logic.md).

Value IDs start with a lowercase letter and use lower camel case. Values have no
properties. See [Portable types](./primitives.md) for every supported type.

## Enum Values

`enum` is a value primitive, not a separate declaration:

```kdl
(enum)value "todoStatus" {
    "open"
    "completed"
    "archived"
}
```

An enum value is constant, has no scalar initial value or `variable` modifier,
and contains at least one unique, non-empty quoted option. The enum value and
each option may contain prompt-only context.

Use an enum value from a collection with a checked `(value)` reference:

```kdl
collection "todo" {
    (enum)"status" (value)"todoStatus"
}
```

Every enum field must contain exactly one reference to an existing enum value.
The CLI reports its canonical reference as `(value)"todoStatus"`.
