# Looking Up Data

A query describes how a screen retrieves one entity. The Contact Viewer looks
up a contact by its ID:

```kdl
query "contactById" by="id" {
    input "id" type="string"
    returns (entity)"contact" missing=#null
}
```

## Query

`"contactById"` is the query ID. It starts with a lowercase letter and should
use lower camel case. Each query needs a different ID.

`by="id"` names the lookup value. Surface resolves it in two places:

- an `input` named `id` on this query;
- a `field` named `id` on the returned entity.

Both must exist and use the same primitive type. This makes the lookup
unambiguous without writing executable query logic.

Rung 3 supports this single-entity lookup shape only. Lists, filtering, and
sorting will be introduced only when a later application needs them.

## Input

An input is a value the query needs:

```kdl
input "id" type="string"
```

Input names use lower camel case and must be unique within the query. Input
types are `string` or `boolean`.

When a web screen uses a query, URL query parameters with matching names supply
its inputs. For example, `/contacts?id=ada` supplies `"ada"` to the `id`
input.

## Returns

Every query has exactly one `returns` node:

```kdl
returns (entity)"contact" missing=#null
```

`(entity)"contact"` is a checked reference to an entity declared in the same
Surface file. The annotation identifies the expected declaration type;
Surface reports an error if the entity does not exist or the annotation is
missing or different.
`missing=#null` says the query returns no entity when the lookup finds
nothing. Use the KDL 2 null literal `#null`, without quotes.

The missing result activates the screen's `notFound` state. A missing query
input activates its `empty` state.

Queries, inputs, and returns can all contain prompt-only
[`context`](./node_context.md).
