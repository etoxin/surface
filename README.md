# Surface Language

**Status:** Initial draft

**Language version:** 0.1

**Host syntax:** KDL 2

**File extension:** `.kdl`

**Character encoding:** UTF-8

Surface is a human- and LLM-readable language for describing an application.
It records what an application is expected to contain and how it is expected to
behave without prescribing its implementation framework.

Surface is being developed incrementally from real applications. This document
only defines the syntax required for the first roadmap application: a Hello
World page. Features remain outside the language until an application creates a
clear need for them.

See [roadmap.md](./roadmap.md) for the planned application progression.

## Current Example

```kdl
/- kdl-version 2

surface-lang "0.1"

application "helloWorld" version="0.1.0" {
    purpose "Display a greeting."
}

screen "home" route="/" {
    section "Hello, world!"
}
```

This specification describes an application named `helloWorld` with one screen
at `/`. The screen contains one section displaying `Hello, world!`.

## Current Scope

Surface 0.1 currently defines three top-level nodes:

```text
surface-lang
application
screen
```

It also defines two child nodes:

```text
purpose
section
```

No other application declarations or child nodes are currently supported.

## KDL Profile

A Surface file MUST be valid KDL 2.

Every Surface file MUST begin with the KDL 2 version marker:

```kdl
/- kdl-version 2
```

Surface uses a deliberately small part of KDL:

- nodes;
- string arguments;
- string properties;
- child blocks;
- single-line and block comments.

Surface currently does not assign meaning to KDL type annotations or special
numeric values.

Although KDL permits unquoted identifier strings, Surface strings SHOULD be
quoted. This keeps files compatible with editors whose KDL support does not yet
recognize every KDL 2 feature.

## Language Version

The first semantic node in every Surface file MUST be:

```kdl
surface-lang "0.1"
```

The node MUST:

- occur exactly once;
- contain exactly one string argument;
- contain no properties;
- contain no children.

A tool MUST reject unsupported Surface versions. It MUST NOT silently interpret
a file using a different language version.

## Declaration Identifiers

The first argument of an `application` or `screen` node is its identifier.

```kdl
application "helloWorld"
screen "home"
```

A Surface identifier:

- MUST begin with a lowercase ASCII letter;
- MAY contain ASCII letters and digits;
- MUST NOT contain spaces, underscores, periods, or hyphens;
- is case-sensitive;
- SHOULD use lower camel case.

The corresponding pattern is:

```text
[a-z][A-Za-z0-9]*
```

Declaration identity is the combination of declaration type and identifier.
Two declarations of the same type MUST NOT have the same identifier.

## Application Declaration

A Surface project MUST contain exactly one `application` declaration.

```kdl
application "helloWorld" version="0.1.0" {
    purpose "Display a greeting."
}
```

An application declaration MUST contain:

- exactly one identifier argument;
- exactly one `version` string property;
- exactly one `purpose` child node.

The `purpose` node MUST contain exactly one string argument and MUST NOT contain
properties or children.

Application versions are product versions. Surface 0.1 records them as strings
and does not assign version-ordering semantics to them.

## Screen Declaration

A `screen` describes a user-facing application page.

```kdl
screen "home" route="/" {
    section "Hello, world!"
}
```

A screen declaration MUST contain:

- exactly one identifier argument;
- exactly one `route` string property;
- one or more `section` child nodes.

Each `section` node MUST contain exactly one string argument and MUST NOT contain
properties or children.

Sections are ordered. Their order in the file is their intended presentation
order.

Surface 0.1 does not define route-pattern syntax. The route is preserved as an
opaque string.

## Comments

Surface inherits KDL comments.

```kdl
// A single-line comment.

/*
    A block comment.
*/
```

Comments MUST NOT change the meaning of a Surface specification. Formatters
SHOULD preserve them.

## Project Structure

A Surface 0.1 project contains exactly one `.kdl` file.

```text
surface.kdl
```

Imports and multi-file projects are not supported at the current roadmap stage.

The `.kdl` extension identifies the host syntax, not Surface by itself. A tool
MUST treat a KDL document as Surface only when it contains the supported
`surface-lang` node or when the file is explicitly passed to a Surface command.

## Validation

A Surface 0.1 validator MUST check:

1. The source is valid KDL 2.
2. The KDL version marker is present.
3. The `surface-lang` node is present exactly once.
4. The Surface language version is supported.
5. Exactly one `application` declaration exists.
6. At least one `screen` declaration exists.
7. Declaration identifiers are valid and unique within their type.
8. Required properties and child nodes are present.
9. Properties are not duplicated.
10. Nodes contain the required number and type of arguments.
11. Unknown top-level nodes, properties, and child nodes are rejected.

Diagnostics SHOULD contain a severity, stable code, message, file, line, column,
related declaration, and suggested correction.

Example:

```text
Error SURF-APP-001

The project does not contain an application declaration.

File: surface.kdl
Suggested correction: Add one application declaration.
```

## Canonical Formatting

A Surface formatter SHOULD use:

- UTF-8 encoding;
- four spaces for indentation;
- no tab characters;
- quoted string arguments and property values;
- one node per line;
- one blank line between top-level declarations;
- original declaration and section order;
- a final newline.

A formatter MUST preserve comments where reasonably possible.

## Intermediate Representation

The example specification should export to an intermediate representation
equivalent to:

```json
{
  "surfaceVersion": "0.1",
  "application": {
    "id": "helloWorld",
    "version": "0.1.0",
    "purpose": "Display a greeting."
  },
  "screens": [
    {
      "id": "home",
      "route": "/",
      "sections": [
        "Hello, world!"
      ]
    }
  ]
}
```

Tools SHOULD preserve source locations, declaration order, section order, and
comments alongside or within their internal representation.

## Tooling

The project uses mise to install the pinned Deno version and run its common
tasks. Install the toolchain and run every validation check with:

```text
mise install
mise run check
```

The rung-1 toolchain implements:

```text
surf parse surface.kdl
surf check surface.kdl
surf format surface.kdl
surf export surface.kdl --format json
```

The available mise tasks are `deps`, `format`, `format-check`, `lint`,
`typecheck`, `test`, `check`, and `surf`. Run the CLI through mise with:

```text
mise run surf check examples/01-hello-world/surface.kdl
mise run surf export examples/01-hello-world/surface.kdl --format json
```

The equivalent direct Deno commands remain available:

```text
deno task check
deno task surf check examples/01-hello-world/surface.kdl
```

No separate package-manager installation step is required; Deno resolves the
pinned imports declared in `deno.json`.

The commands intentionally support only the syntax defined in this document.

## Rung-1 Artifacts

The completed rung includes:

- [`surface.kdl`](./examples/01-hello-world/surface.kdl), the valid example;
- [`expected-ir.json`](./examples/01-hello-world/expected-ir.json), its reviewed
  intermediate representation;
- [`invalid/`](./examples/01-hello-world/invalid/), focused diagnostic fixtures;
- [`index.html`](./examples/01-hello-world/app/index.html), the implemented page;
- [`SKILL.md`](./skills/surface-language/SKILL.md), the LLM authoring and review
  skill.

## LLM Skill Target

Every roadmap rung MUST update the version-controlled Surface skill used by
LLMs to create, edit, review, and validate Surface files.

For the current rung, the skill should teach an LLM to:

- recognize Surface from the `surface-lang` node rather than from `.kdl` alone;
- write the complete Hello World specification;
- use only `application`, `screen`, `purpose`, and `section` nodes;
- preserve quoted strings, comments, and declaration order;
- apply the validation rules in this document;
- avoid inventing features from later roadmap applications;
- report when a requested concept is outside the current language scope.

The skill MUST remain concise and MUST describe only released Surface syntax.
Language changes and their corresponding skill changes SHOULD be reviewed and
committed together.

## Current Non-Goals

Surface 0.1 does not yet define:

- actors;
- entities or fields beyond the exported example structure;
- queries or behaviors;
- events;
- policies;
- workflows;
- interfaces;
- components;
- scenarios;
- requirements or decisions;
- integrations or jobs;
- deployments;
- imports;
- executable semantics;
- code generation.

These features will be considered when their corresponding roadmap application
is started.

## Success Criteria

The first roadmap stage is complete when:

1. A person can understand and edit the complete example without specialist
   training.
2. A parser can convert it into the documented IR.
3. A validator accepts the example and reports useful errors for invalid forms.
4. A formatter is idempotent and preserves comments.
5. The Hello World application can be implemented from the specification
   without additional product decisions.
6. The Surface skill can guide an LLM to create, modify, and review the example
   without introducing unsupported syntax.
