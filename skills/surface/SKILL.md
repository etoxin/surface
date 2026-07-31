---
name: surface
description: Create, edit, review, format, and validate Surface application specifications written as KDL 2 files. Use for files containing a surface node, requests to author a Surface specification, or work on the Surface repository and its rung-1 Hello World application.
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

## Complete Rung-1 Syntax

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

Declare at least one screen:

```kdl
screen "home" title="Home" route="/" {
    section "Hello, world!"
}
```

An application has exactly:

- one quoted identifier argument;
- no properties;
- one `purpose` child containing one quoted string.

A screen has:

- one quoted identifier argument;
- zero or one quoted `title` property;
- zero or one quoted `route` property;
- one or more ordered `section` children, each containing one quoted string.

Use `title` when a screen has a user-facing name. Use `route` for addressable
screens such as web pages. Omit either property when it does not apply.

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
- Properties are not duplicated.
- No unsupported top-level nodes, child nodes, properties, or type annotations
  appear.

When reporting a problem, include its location, the violated rule, and a
specific valid correction.

## Formatting

Use four spaces, no tabs, quoted strings, one node per line, one blank line
between top-level declarations, and a final newline. Preserve comments and the
original application, screen, and section order.

## Tool Commands

```text
surf parse surface.kdl
surf check surface.kdl
surf format surface.kdl
surf export surface.kdl --format json
```

## Current Limits

Do not add actors, entities, fields, queries, behaviors, events, policies,
workflows, interfaces, components, scenarios, imports, executable logic, or code
generation. These features are not part of rung 1.
