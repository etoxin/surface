# Defining Functions

A `function` describes a named computation or capability. It can represent a
database lookup, HTTP request, file read, calculation, or other implementation.
The Contact Viewer uses one to look up a contact by its ID:

```kdl
function "contactById" {
    context "Find the contact whose id equals the id input."

    collection "contactLookup" {
        (string)"id"
    }

    input (collection)"contactLookup"
    output (collection)"contact"

    context "If there is no contact, produce null."
}
```

## Function

`"contactById"` is the function ID. It starts with a lowercase letter and should
use lower camel case. Each function needs a different ID.

Functions have no properties. Their `input` and `output` nodes use checked
collection references, while [`context`](./node_context.md) explains how the
function uses the input to produce the result.

Rung 3 supports only an optional collection input and exactly one collection
output. Later applications will extend that shape only when they need other
kinds of computation.

## Private Collections

A function can declare collections that are private to that function:

```kdl
collection "contactLookup" {
    (string)"id"
}
```

Private collections use the same field syntax as global collections. They can
be referenced by `input` and `output` inside their function, but other
functions cannot see them. A private collection ID cannot duplicate a global
collection ID.

## Input

A function can accept one structured collection input:

```kdl
input (collection)"contactLookup"
```

The reference can target a private collection in the function or a global
collection in the Surface file. A function can omit `input` when it needs no
caller-supplied data, but it cannot contain several input nodes.

The function deliberately does not prescribe where those values come from. An
interface might collect them through controls, while another implementation
might map them from a URL, file, or API. Describe that relationship with
typed [`context`](./node_context.md) references.

## Output

Every function has exactly one `output` node:

```kdl
output (collection)"contact"
```

`(collection)"contact"` is a checked reference to a visible collection. It can
target a private collection in this function or a global collection in the
Surface file. The annotation identifies the expected declaration type; Surface
reports an error if the collection does not exist or the annotation is missing
or different.

Use [`context`](./node_context.md) to describe what happens when no collection is
found:

```kdl
context "If there is no contact, produce null."
```

Describe missing inputs and missing results in function or interface context.
For example, an interface can reference the function and say what a user should
see when no matching collection exists.

Function, input, and output nodes can all contain prompt-only
[`context`](./node_context.md).
