---
name: surface
description: Create, edit, review, format, and validate Surface application specifications written as KDL 2 files. Use for files containing a surface node, requests to author a Surface specification, or work on the Surface repository and its released Hello World and Static FAQ applications.
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

Declare at least one screen:

```kdl
screen "faq" route="/faq" {
    section "What is Surface?" {
        context "Present the section name as a question."
        text """
            Surface is a format for describing an application.

            It does not choose an implementation framework.
            """
    }
    section "Does every screen need a route?" {
        text "No. Omit route when the screen is not addressable."
    }
}
```

An application has exactly:

- one quoted identifier argument;
- no properties;
- one `purpose` child containing one quoted string.

A screen has:

- one quoted identifier argument;
- zero or one quoted `route` property;
- one or more ordered `section` children.

Use `route` for addressable screens such as web pages. Omit it when the screen
does not have a URL or equivalent address.

A section has:

- one quoted string name;
- no properties;
- zero or one `title` child containing one quoted string;
- one or more ordered `text` children, each containing one quoted string.

Build a static FAQ with repeated sections: use each section name as the
question and its text as the answer. Do not invent `question` or `answer`
nodes.

Use KDL triple-quoted strings for multiline text. Put the opening newline
immediately after `"""` and align content with the closing delimiter so KDL
dedents it correctly.

## Prompt Context

Add zero or more `context` children to any Surface node except another
`context`. This includes `text`. Each context contains exactly one quoted
prompt string and has no properties or children.

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
- Every section contains at least one text node.
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
workflows, interfaces, components, scenarios, imports, executable logic, or
code generation. These features are not part of the released syntax.
