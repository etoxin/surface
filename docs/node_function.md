# Defining Functions

A `function` describes a named computation or capability. It can represent a
database lookup, HTTP request, file read, calculation, or other implementation.
The Contact Viewer uses one to look up a contact by its ID:

```kdl
function "contactById" {
    context "Find the contact whose id equals the id input."

    entity "contactLookup" {
        (string)"id"
    }

    input (entity)"contactLookup"
    returns (entity)"contact"

    context "If there is no contact, return null."
}
```

## Function

`"contactById"` is the function ID. It starts with a lowercase letter and should
use lower camel case. Each function needs a different ID.

Functions have no properties. Their `input` and `returns` nodes use checked
entity references, while [`context`](./node_context.md) explains how the function
uses the input to produce the result.

Rung 3 supports only an optional entity input and exactly one entity return.
Later applications will extend that shape only when they need other kinds of
computation.

## Private Entities

A function can declare entities that are private to that function:

```kdl
entity "contactLookup" {
    (string)"id"
}
```

Private entities use the same field syntax as global entities. They can be
referenced by `input` and `returns` inside their function, but other functions
cannot see them. A private entity ID cannot duplicate a global entity ID.

## Input

A function can accept one structured entity input:

```kdl
input (entity)"contactLookup"
```

The reference can target a private entity in the function or a global entity in
the Surface file. A function can omit `input` when it needs no caller-supplied
data, but it cannot contain several input nodes.

The function deliberately does not prescribe where those values come from. An
interface might collect them through controls, while another implementation
might map them from a URL, file, or API. Describe that relationship with
typed [`context`](./node_context.md) references.

## Returns

Every function has exactly one `returns` node:

```kdl
returns (entity)"contact"
```

`(entity)"contact"` is a checked reference to a visible entity. It can target
a private entity in this function or a global entity in the Surface file. The
annotation identifies the expected declaration type; Surface reports an error
if the entity does not exist or the annotation is missing or different.

Use [`context`](./node_context.md) to describe what happens when no entity is
found:

```kdl
context "If there is no contact, return null."
```

Describe missing inputs and missing results in function or interface context. For
example, an interface can reference the function and say what a user should see
when no matching entity exists.

Functions, inputs, and returns can all contain prompt-only
[`context`](./node_context.md).
