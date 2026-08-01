# Looking Up Data

A query describes how an application retrieves one entity. The Contact Viewer looks
up a contact by its ID:

```kdl
query "contactById" {
    context "Find the contact whose id equals the id input."

    entity "contactLookup" {
        (string)"id"
    }

    input (entity)"contactLookup"
    returns (entity)"contact"

    context "If there is no contact, return null."
}
```

## Query

`"contactById"` is the query ID. It starts with a lowercase letter and should
use lower camel case. Each query needs a different ID.

Queries have no properties. Their `input` and `returns` nodes use checked
entity references, while [`context`](./node_context.md) explains how the query
uses the input to produce the result.

Rung 3 supports this single-entity lookup shape only. Lists, filtering, and
sorting will be introduced only when a later application needs them.

## Private Entities

A query can declare entities that are private to that query:

```kdl
entity "contactLookup" {
    (string)"id"
}
```

Private entities use the same field syntax as global entities. They can be
referenced by `input` and `returns` inside their query, but other queries
cannot see them. A private entity ID cannot duplicate a global entity ID.

## Input

A query can accept one structured entity input:

```kdl
input (entity)"contactLookup"
```

The reference can target a private entity in the query or a global entity in
the Surface file. A query can omit `input` when it needs no caller-supplied
data, but it cannot contain several input nodes.

The query deliberately does not prescribe where those values come from. An
interface might collect them through controls, while another implementation
might map them from a URL, file, or API. Describe that relationship with
typed [`context`](./node_context.md) references.

## Returns

Every query has exactly one `returns` node:

```kdl
returns (entity)"contact"
```

`(entity)"contact"` is a checked reference to a visible entity. It can target
a private entity in this query or a global entity in the Surface file. The
annotation identifies the expected declaration type; Surface reports an error
if the entity does not exist or the annotation is missing or different.

Use [`context`](./node_context.md) to describe what happens when no entity is
found:

```kdl
context "If there is no contact, return null."
```

Describe missing inputs and missing results in query or interface context. For
example, an interface can reference the query and say what a user should see
when no matching entity exists.

Queries, inputs, and returns can all contain prompt-only
[`context`](./node_context.md).
