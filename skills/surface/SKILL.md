---
name: surface
description: Create, edit, review, format, and validate Surface 0.1 application specifications written as KDL 2 files. Use for Surface files or repository work involving the released application, collection, function, interface, screen, and context syntax.
---

# Surface

Use only the released syntax below. Do not invent structured UI or behaviour
nodes when prompt context can express the requirement.

## Workflow

1. Confirm the first line is `/- kdl-version 2` and the first semantic node is
   `surface "0.1"`.
2. Read the repository `README.md` when available; it is authoritative if it
   differs from this skill.
3. Preserve comments, declaration order, prompts, and unrelated content.
4. When editing an existing file, run `surf reference surface.kdl --list`
   before adding a reference if the repository CLI is available. For a new
   file, draft its declarations first, then use the command to verify them.
5. After editing, run `surf check`; format only a valid document.
6. Explain an out-of-scope request instead of inventing syntax.

## Canonical Example

```kdl
/- kdl-version 2

surface "0.1"

application "contactViewer" {
    purpose "Display a contact selected by identifier."
}

collection "contact" {
    (string)"id"
    (string)"name"
    (string)"email" optional
    (boolean)"active"
}

function "contactById" {
    context "Find the contact whose id equals the id input."

    collection "contactLookup" {
        (string)"id"
    }

    input (collection)"contactLookup"
    output (collection)"contact"

    context "If there is no contact, produce null."
}

interface "contactViewer" {
    context (function)"contactById" (collection)"contact" "Render a user interface that asks for a contact id and displays the matching contact's name, email, and active status."
    context (function)"contactById" "When no id is provided, ask the user to select a contact."
    context (function)"contactById" "When no contact matches, show that the contact was not found."
}

screen "home" route="/" {
    context (screen)"contact" "Redirect to this screen."
}

screen "contact" route="/contacts" {
    use (interface)"contactViewer"
}
```

## Declarations

Declare exactly one application with one purpose:

```kdl
application "helloWorld" {
    purpose "Display a greeting."
}
```

An application and purpose take one quoted string, have no properties, and may
contain `context`. The application ID is not a display title.

A collection takes one ID, has no properties, and contains one or more fields:

```kdl
collection "contact" {
    (string)"name"
    (string)"email" optional
    (boolean)"active"
}
```

A field is a node whose annotation is `(string)` or `(boolean)` and whose name
is a quoted lower-camel-case identifier. Fields are required by default. The
only modifier is bare `optional`; do not write `required`, `generated`, or
`field "name" type="string"`.

A function is a named computation or capability. It may represent a database
lookup, HTTP request, file read, calculation, or another implementation. The
current syntax gives it one ID, no properties, zero or more private collections,
zero or one structured input, and exactly one collection output:

```kdl
function "contactById" {
    collection "contactLookup" {
        (string)"id"
    }
    input (collection)"contactLookup"
    output (collection)"contact"
}
```

`input` and `output` may reference a private collection in their function or a
global collection. Private IDs are unique in their function and cannot shadow
global collection IDs. Other functions cannot see them. Use context to explain
data sources, transformations, and missing results; Surface does not define
URL-to-input mapping.

An interface describes visible or usable UI through intent, not widget syntax:

```kdl
interface "helloWorld" {
    context "Render a user interface with the exact text: Hello, world!"
}
```

An interface takes one ID, has no properties, and accepts only `context`
children. Do not add `section`, `title`, `text`, `field`, `input`, `button`,
`selector`, or component children. The implementing LLM or person chooses copy,
layout, and controls consistent with the context.

Describe local, unambiguous interaction through interface context rather than
inventing state or behaviour syntax:

```kdl
interface "clickCounter" {
    context """
        Render an accessible counter starting at 0.
        Show the current value prominently.
        Provide an Increment action that increases the value by 1.
        Provide a Reset action that restores the value to 0.
        Update the displayed value immediately after either action.
        """
}
```

Do not add a collection or function solely to represent interface-local state.
Do not invent `actor`, `behaviour`, `event`, `scenario`, `state`, `action`, or
numeric field syntax. Use additional released declarations only when the
application needs shared data or a separately callable capability.

Declare at least one screen. A screen takes one ID, an optional quoted `route`,
and either one interface use plus optional contexts or context alone:

```kdl
screen "home" route="/" {
    use (interface)"helloWorld"
}

screen "redirectHome" {
    context (screen)"home" "Continue to this screen."
}
```

`use` accepts exactly one checked `(interface)` reference. A screen cannot have
multiple uses and cannot be empty. A context-only screen expresses non-visual
behaviour; do not invent `logic`, `redirect`, or UI-state nodes.

Identifiers match `[a-z][A-Za-z0-9]*`, are case-sensitive, and should use lower
camel case. Declaration IDs are unique within their type. Field names are
unique within their collection.

## Context and References

Add repeatable `context` children to any supported node except another context:

```kdl
context "Use accessible defaults."
context (function)"contactById" (collection)"contact" "Display the returned contact."
```

The last argument is exactly one unannotated prompt string. Earlier arguments,
if present, are annotated string references. A type annotation on a string
means that the string references another Surface declaration. Global
`application`, `collection`, `interface`, `function`, and `screen` declarations
may be referenced. A context inside a function may also reference that
function's private collections. Verify every reference's visibility, ID, and
annotation type.

Context has no properties or children. Preserve it in source and formatting;
it is omitted from the reduced semantic JSON IR. Use KDL triple-quoted strings
for multiline prompts, with content starting on the next line.

Do not confuse value annotations with field node annotations:
`(string)"name"` declares a field, while `(collection)"contact"` after `output`
is a checked reference.

## Validation Checklist

- The file parses as KDL 2 and begins with the required marker.
- `surface "0.1"` occurs once as the first semantic node.
- Exactly one application and at least one screen exist.
- Required arguments and children occur exactly as specified.
- IDs and field names are valid and unique in their scopes.
- Collection fields use supported node annotations and only bare `optional`.
- Private collections do not shadow globals.
- Every typed reference resolves with the correct type and visibility.
- Every interface contains only context.
- Every screen has one interface use or at least one context, never multiple
  uses or an empty body.
- Properties are allowed only where documented and are not duplicated.
- No unsupported or legacy nodes, modifiers, annotations, or properties appear.

When diagnosing, distinguish valid KDL from valid Surface and give a concrete
released-syntax correction with the source location.

## Formatting and CLI

Use four spaces, no tabs, quoted strings, one node per line, one blank line
between top-level declarations, and a final newline. Preserve comments and
source order.

```text
surf parse surface.kdl
surf check surface.kdl
surf format surface.kdl
surf export surface.kdl --format json
surf reference surface.kdl --list
surf reference surface.kdl interface.contactViewer
```

Private collection selectors include their function scope, such as
`function.contactById.collection.contactLookup`.

## Current Limits

Do not add actors, numeric field types, behaviours, events, policies, workflows,
components, scenarios, imports, executable logic, list-returning functions,
filtering, sorting, structured UI elements, or code-generation directives. Add
future syntax only when a later roadmap rung releases it.
