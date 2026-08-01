---
name: surface
description: Create, edit, review, format, and validate Surface application specifications written as KDL 2 files. Use for files containing a surface node, requests to author a Surface specification, or work on the Surface repository and its released Hello World, Static FAQ, and Contact Viewer applications.
---

# Surface

Work only with the released Surface syntax described here. Do not introduce
constructs from future roadmap applications.

## Workflow

1. Confirm the document contains `surface "0.1"`. Do not treat an arbitrary
   `.kdl` file as Surface based on its extension alone.
2. Read the repository's `README.md` when available and treat it as
   authoritative if it differs from this skill.
3. Preserve comments, declaration order, unrelated content, and quoted strings
   when editing.
4. Use only the nodes and properties supported below.
5. Run `surf check` after editing when the repository toolchain is available.
6. Run `surf format` only when the document already passes validation.
7. Report requests outside the current Surface scope instead of inventing
   syntax.

## Complete Released Syntax

Write the KDL marker and Surface version first:

```kdl
/- kdl-version 2

surface "0.1"
```

Declare exactly one application:

```kdl
application "helloWorld" {
    purpose "Display a greeting."
}
```

Declare read-only data and a single-entity lookup when needed:

```kdl
entity "contact" {
    field "id" type="string" generated
    field "name" type="string"
    field "email" type="string" optional
    field "active" type="boolean"
}

query "contactById" by="id" {
    input "id" type="string"
    returns (entity)"contact" missing=#null
}
```

An application has exactly:

- one quoted identifier argument;
- no properties;
- one `purpose` child containing one quoted string.

An entity has one quoted identifier, no properties, and one or more `field`
children. Give every field:

- one quoted lower-camel-case name unique within the entity;
- required `type="string"` or `type="boolean"`;
- optional bare `generated` modifier;
- optional bare `optional` modifier. Omit it for a required field.

Put modifiers after the `type` property. Do not give them values: reject old
forms such as `generated=#true` and `optional=#true`.

A query is a single-entity lookup. Give it:

- one quoted identifier;
- required quoted `by` property;
- one or more `input` children with a quoted name and required primitive
  `type`;
- exactly one `returns (entity)"<entity>" missing=#null` child.

Resolve `by` to both an input on the query and a field on the returned entity.
Require those types to match.

Treat a type annotation on a string as a checked reference to a top-level
Surface declaration of that type. Require the annotation and verify both the
target ID and its declaration type. Rung 3 supports `(entity)` on `returns`
arguments and `(query)` on screen `use` arguments. Reject annotations in all
other positions.

Declare at least one screen. A queried screen looks like:

```kdl
screen "contact" route="/contacts" {
    use (query)"contactById"
    section "Contact" {
        title "Contact"
        field "name"
        field "email"
        field "active"
    }
    state "empty" {
        section "No contact selected" {
            text "Choose a contact identifier."
        }
    }
    state "notFound" {
        section "Contact not found" {
            text "No contact exists for that identifier."
        }
    }
}
```

A screen has:

- one quoted identifier argument;
- zero or one quoted `route` property;
- zero or one `use (query)"<query>"` child;
- one or more ordered `section` children.

Use `route` for addressable screens such as web pages. Omit it when the screen
does not have a URL or equivalent address.

For web screens, populate query inputs from URL query parameters with matching
names. Require screens with a query `use` to contain exactly one `empty` and
one `notFound` state. Put one or more static sections inside each state. Do
not put field references in state sections.

A section has:

- one quoted string name;
- no properties;
- zero or one `title` child containing one quoted string;
- one or more ordered `text` or `field` children.

Use `field "<name>"` in a normal section to project a field from the entity
returned by the screen query. Require that reference to resolve. Continue to
use `field "<name>" type="..." [generated] [optional]` only inside an entity
declaration.
Do not mix `text` and field references in the same section.

Build a static FAQ with repeated sections: use each section name as the
question and its text as the answer. Do not invent `question` or `answer`
nodes.

Use KDL triple-quoted strings for multiline text. Put the opening newline
immediately after `"""` and align content with the closing delimiter so KDL
dedents it correctly.

## Prompt Context

Add zero or more `context` children to any Surface node except another
`context`. This includes entities, fields, queries, inputs, returns, uses,
states, and text. Each context contains exactly one quoted prompt string and
has no properties or children.

Use context as guidance for interpreting or implementing its parent. Preserve
it when editing and formatting, but do not treat it as application behavior or
include it in the semantic JSON IR.

Identifiers must match `[a-z][A-Za-z0-9]*` and should use lower camel case.

## Validation Checklist

Check all of the following:

- The source parses as KDL 2.
- The first line is `/- kdl-version 2`.
- `surface "0.1"` is the first semantic node and occurs once.
- Exactly one application exists.
- At least one screen exists.
- Declaration identifiers are valid and unique within their type.
- Required arguments, properties, and children are present exactly as defined.
- Entity fields and query inputs have valid unique names and supported types.
- Field modifiers use the bare words `generated` and `optional`; required is
  implicit. Null properties use `#null`, not a quoted string.
- Annotated entity and query references have the required type and resolve.
- Lookup fields/inputs and projected fields resolve.
- Lookup input and entity-field types match.
- Every queried screen contains exactly one `empty` and one `notFound`
  state.
- Every section contains at least one text or field node.
- Properties are not duplicated.
- No unsupported top-level nodes, child nodes, properties, reference types, or
  misplaced type annotations appear.

When reporting a problem, include its location, the violated rule, and a
specific valid correction.

## Formatting

Use four spaces, no tabs, quoted strings, one node per line, one blank line
between top-level declarations, and a final newline. Preserve comments and all
declaration, field, input, screen, state, section, text, and field-reference
order.

## Tool Commands

```text
surf parse surface.kdl
surf check surface.kdl
surf format surface.kdl
surf export surface.kdl --format json
```

## Current Limits

Do not add actors, numeric types or values, behaviors, events, policies,
workflows, interfaces, components, scenarios, imports, executable logic, list
queries, filtering, sorting, or code generation. These features are not part
of the released syntax.
