# Portable Types

Collections and values use the same language-neutral type annotations. Surface
records the type; the implementing LLM or person maps it to the closest safe
type in the target language.

```kdl
collection "todo" {
    (string)"text"
    (date)"dueDate" optional
    (number)"priority"
    (array)"tags" optional
}

(number)value "defaultPriority" 1
(array)value "todos" variable
```

## Types

| Type | Intended meaning |
| --- | --- |
| `string` | Text of any length |
| `char` | One character |
| `boolean` | True or false |
| `bytes` | Binary data |
| `number` | General numeric value |
| `integer` | General whole number |
| `bigint` | Arbitrary-precision whole number |
| `decimal` | Base-10 decimal value |
| `float32`, `float64` | IEEE-style floating-point values |
| `int8`, `int16`, `int32`, `int64` | Signed fixed-width integers |
| `uint8`, `uint16`, `uint32`, `uint64` | Unsigned fixed-width integers |
| `date` | Calendar date without a time |
| `time` | Time of day without a date |
| `dateTime` | Combined date and time |
| `duration` | Length of time |
| `uuid` | Universally unique identifier |
| `url` | URL or URI |
| `array` | Ordered, indexable sequence |
| `tuple` | Fixed-position sequence |
| `set` | Collection of unique items |
| `map` | Key-value collection |
| `object` | Language-neutral object or record |
| `json` | JSON-compatible data |
| `regex` | Regular-expression pattern |
| `enum` | One option from a named enum value declaration |
| `any` | Intentionally unconstrained value |
| `unknown` | Value whose type must be checked before use |

Surface does not yet add generic element, key, or object-property syntax to
container types. Describe those expectations with context, or use a named
collection when a reusable object shape needs checked fields:

```kdl
(array)"tags" optional {
    context "Contain string labels."
}
```

Use `(enum)` fields only with one checked value reference. Other field types
accept only the optional modifier. Fields are required unless marked optional.
