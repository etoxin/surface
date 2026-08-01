# Surface 0.1 Grammar

This document fixes the complete Surface 0.1 language. Surface 0.1 is frozen: new
declarations, child nodes, properties, modifiers, annotations, or reference types
require a later format version. Clarifications, diagnostics, formatter changes, and
parser bug fixes may be released without changing which documents are valid.

Surface uses KDL 2 for strings, numbers, Booleans, nulls, comments, raw strings, and
child blocks. Canonical Surface formatting uses quoted strings, four-space indentation,
one node per line, one blank line between top-level declarations, and a final newline.

## Document

Every file begins with the exact marker `/- kdl-version 2`. Its first semantic node is
exactly:

```kdl
surface "0.1"
```

A document contains:

- exactly one `surface` node;
- exactly one `application` declaration;
- zero or more `value`, `collection`, `function`, and `interface` declarations;
- one or more `screen` declarations.

No other top-level node is valid. Declaration order after `surface` is significant in
source and preserved by formatting. IDs match `[a-z][A-Za-z0-9]*`, are case-sensitive,
and are unique within their declaration type.

## Application

```kdl
application "applicationId" {
    purpose "What the application is for."

    stack "stackId" {
        target "browser"
        technology "language" "typescript" version="5.9"
    }

    context "Optional prompt guidance."
}
```

An application has one ID, no properties, exactly one `purpose`, zero or more uniquely
named `stack` children, and zero or more `context` children.

`purpose` has one string, no properties, and optional `context` children.

Each stack has one ID, no properties, exactly one non-empty string `target`, one or more
`technology` children, and optional `context`. A target may also contain context.

A technology has two strings—an open-ended lower-camel-case role and a non-empty
name—plus the only general Surface property:

```kdl
technology "role" "name" version="quoted version"
```

`version` is optional, unique, unannotated, and string-valued. A stack cannot repeat the
same role-and-name pair. Technology children may contain context.

## Values

```kdl
(number)value "limit" 10
(array)value "items" variable
(string)value "name" "Surface" variable
```

A non-enum value has one portable type annotation, one ID, an optional compatible scalar
initial value, an optional final bare `variable` modifier, no properties, and optional
context. Without `variable`, it is constant. Container primitives do not have literal
initial values in Surface 0.1.

An enum is a constant value whose unique, non-empty string options are quoted child node
names:

```kdl
(enum)value "status" {
    "open"
    "closed" {
        context "Optional guidance for this option."
    }
}
```

An enum has no scalar initial value or `variable` modifier. It contains one or more
options plus optional context. Options have no arguments or properties and may contain
context.

## Collections

```kdl
collection "contact" {
    (string)"id"
    (string)"email" optional
    (enum)"status" (value)"contactStatus"
}
```

A collection has one ID, no properties, one or more uniquely named fields, and optional
context. A function may contain private collections with the same shape. A private
collection ID is unique in that function and cannot shadow a global collection ID.

A field puts one portable type annotation on its lower-camel-case name. Fields are
required by default. The only field modifier is one bare `optional`. An enum field also
has exactly one checked `(value)` reference to a global enum value. No other field
arguments or properties are valid. Fields may contain context.

The fixed portable type set is:

```text
any array bigint boolean bytes char date dateTime decimal duration enum
float32 float64 int8 int16 int32 int64 integer json map number object regex
set string time tuple uint8 uint16 uint32 uint64 unknown url uuid
```

## Functions

```kdl
function "findContact" {
    collection "lookup" {
        (string)"id"
    }

    input (collection)"lookup"
    output (collection)"contact"
    logic "Find and output the matching contact, or output null."
}
```

A function has one ID, no properties, zero or more private collections, at most one
checked collection `input`, exactly one checked collection `output`, at most one
`logic`, and optional context. Input and output may reference a visible private
collection or a global collection. Input and output nodes may contain context.

## Interfaces and Screens

```kdl
interface "contactViewer" {
    context "Render an accessible contact viewer."
    logic "Show a not-found state when no contact is returned."
}

screen "home" {
    use (interface)"contactViewer"
    logic "Use / as this screen's URL path."
}
```

An interface has one ID, no properties, zero or more context children, and at most one
logic child.

A screen has one ID, no properties, at most one checked interface `use`, zero or more
context children, and at most one logic child. It must contain at least one of `use`,
`context`, or `logic`. A use node may contain context.

## Context

Context is non-normative prompt guidance and is omitted from the reduced JSON IR:

```kdl
context "One prompt string."
context (function)"findContact" (collection)"contact" "Use these declarations."
```

A context node has no annotation, properties, or children. Its final argument is one
unannotated string prompt. Every preceding argument is an annotated string reference.
Valid reference annotations are `(application)`, `(value)`, `(collection)`,
`(function)`, `(interface)`, and `(screen)`. References resolve globally, except that
context inside a function may also see that function's private collections.

Context is valid on `surface`, `application`, `purpose`, `stack`, `target`, `technology`,
`value`, enum options, `collection`, fields, `function`, `input`, `output`, `interface`,
`screen`, and `use`. It is invalid on `context`, `logic`, and logic instructions.

## Logic

Logic is normative, ordered, retained in the reduced JSON IR, and valid only on
functions, interfaces, and screens. One unreferenced instruction may be inline:

```kdl
logic "Use / as this screen's URL path."
```

Multiple instructions or references use a block:

```kdl
logic {
    "Validate the input."
    (function)"findContact" "Call this function."
    "If it outputs null, show an error."
}
```

A block is non-empty. A plain instruction is a quoted node name with no arguments. A
referenced instruction is a quoted node name annotated with one valid reference type,
followed by one unannotated instruction string. It has no properties or children.
Function logic may reference that function's private collections; all other references
resolve globally.

Conditions, comparisons, arithmetic, errors, HTTP operations, events, and all other
operators remain inside instruction strings. Surface 0.1 has no structured expression or
control-flow nodes.

## Fixed Boundary

Surface 0.1 does not contain actors, behaviours, components, constraints, decisions,
deployments, endpoints, events, extensions, imports, integrations, jobs, policies,
requirements, scenarios, workflows, structured UI nodes, formal transactions, or
code-generation directives. Applications express those concerns through the released
data, function, interface, screen, context, logic, and stack vocabulary when that is
sufficiently clear.
