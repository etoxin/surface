# Surface Roadmap

## Development Strategy

Surface will grow from applications rather than from speculative format design.

Each roadmap application should be the smallest application that creates a real
need for the next Surface feature. Surface syntax and semantics should only be
added when the current application cannot be described clearly without them.

Surface files will use a constrained KDL 2 profile as their concrete syntax.
Surface will continue to define its own declarations, validation rules,
references, intermediate representation, and semantics.

Surface specifications use the standard `.kdl` extension. The `surface`
node distinguishes a Surface document from other KDL documents.

## Guiding Rules

1. Begin with observable application behavior.
2. Attempt to express it using existing Surface features.
3. Add the smallest general feature that removes the blocking limitation.
4. Avoid adding syntax solely for a hypothetical future application.
5. Map every new construct deterministically into the Surface IR.
6. Record unresolved semantics as decisions rather than silently assuming them.
7. Keep earlier examples valid unless a deliberate format-version change is
   made.
8. Prefer one authoritative representation of each fact over duplicated
   relationships.
9. Update the Surface LLM skill in the same rung as the Surface feature it
   teaches.
10. Add or update human-facing node documentation in `docs/` in the same rung
    as the syntax it describes.

## Completion Gate

Each application is complete when:

- its Surface specification parses;
- its formatter is idempotent;
- formatting does not change its meaning;
- it exports to a reviewed IR snapshot;
- all references resolve;
- its required validation rules pass;
- invalid fixtures produce clear diagnostics;
- human-facing documentation covers every node introduced or changed by the
  rung;
- the application can be implemented from the specification;
- implementation assumptions are recorded as decisions;
- the application has at least one observable acceptance scenario when behavior
  is present;
- the Surface LLM skill documents the newly supported syntax;
- the skill does not expose syntax from future rungs;
- the skill passes its structural validation;
- the skill is forward-tested on creating, modifying, and reviewing the rung's
  application.

## Node Documentation Deliverable

Each rung MUST add or update the human-facing documentation for every node it
introduces or changes. Write these docs for someone authoring a Surface file,
not as a mirror of the parser implementation. They should explain:

- what the node describes and when to use it;
- where it belongs in the file;
- what values the author supplies;
- which nested nodes are required or optional;
- practical examples and common mistakes.

Keep parser, diagnostic, and IR details in the source and tests unless an
author needs them to write a correct file.

Keep these references in `docs/` and link them from the relevant rung's
**Delivered in** list, directly or through a node-reference index.

## LLM Skill Deliverable

The Surface skill is a versioned part of the format, not secondary documentation.
It should enable an LLM to work correctly at the current rung without loading
the entire design history.

Each rung MUST update the skill's:

- trigger description when its supported tasks change;
- concise authoring workflow;
- supported declaration and child-node reference;
- validation checklist;
- canonical example;
- explicit current limitations;
- forward-test prompts and expected acceptance conditions.

At minimum, forward testing should ask a fresh LLM to:

1. create the rung's application from a short product request;
2. modify an existing valid Surface file without changing unrelated content;
3. diagnose an invalid Surface file and suggest a valid correction.

The skill should follow the standard skill package structure:

```text
surface/
    SKILL.md
    agents/
        openai.yaml
```

Add `references/`, `scripts/`, or `assets/` only when they remove repeated work
or keep essential detail out of `SKILL.md`. Validate the skill after every rung
and keep the main instructions concise.

## Application Ramp

### 1. Hello World Page

**Status:** Complete

Build a single page that displays a greeting.

Introduces:

- the KDL-based Surface file;
- the Surface version marker;
- `application` declarations;
- `screen` declarations;
- named `section` blocks;
- optional section titles and ordered text;
- prompt-only `context` annotations on any node;
- nested child blocks;
- declaration identifiers;
- strings and scalar properties;
- comments;
- the first formatter and IR export.

This stage should validate that a Surface project contains exactly one
application declaration.

Delivered in:

- [`examples/01-hello-world/surface.kdl`](./examples/01-hello-world/surface.kdl);
- [`examples/01-hello-world/expected-ir.json`](./examples/01-hello-world/expected-ir.json);
- [`examples/01-hello-world/invalid/`](./examples/01-hello-world/invalid/);
- [`examples/01-hello-world/app/index.html`](./examples/01-hello-world/app/index.html);
- [Rung 1 writing guide](./docs/README.md);
- [`skills/surface/SKILL.md`](./skills/surface/SKILL.md).

### 2. Static FAQ

**Status:** Complete

Build a page containing several questions and answers.

Introduces:

- repeated FAQ entries composed from generic sections and text;
- multiline natural-language content;
- ordering across repeated content groups;
- comment preservation;
- canonical formatting of nested content.

This stage should settle how repeated KDL nodes map into ordered IR collections.
It MUST NOT add FAQ-specific `question` or `answer` nodes: a section name holds
the question and its text holds the answer.

Delivered in:

- [`examples/02-static-faq/surface.kdl`](./examples/02-static-faq/surface.kdl);
- [`examples/02-static-faq/expected-ir.json`](./examples/02-static-faq/expected-ir.json);
- [`examples/02-static-faq/invalid/`](./examples/02-static-faq/invalid/);
- [`examples/02-static-faq/app/index.html`](./examples/02-static-faq/app/index.html);
- [Rung 2 decisions and acceptance scenario](./examples/02-static-faq/decisions.md);
- [FAQ writing guide](./docs/node_screen.md#building-an-faq);
- [`skills/surface/SKILL.md`](./skills/surface/SKILL.md).

### 3. Contact Viewer

Build a read-only page that displays a contact selected by identifier.

Introduces:

- `entity` declarations;
- `query` declarations;
- primitive field types;
- generated and optional fields;
- Boolean and null values;
- query inputs and return types;
- references between declarations;
- not-found and empty screen states.

This stage should establish field syntax and contextual reference resolution.

### 4. Click Counter

Build a counter that a visitor can increment and reset.

Introduces:

- `actor` declarations;
- `behavior` declarations;
- `event` declarations;
- `scenario` declarations;
- numeric values;
- preconditions and effects;
- emitted events;
- behavior errors;
- observable state changes.

This is the first application with mutation and acceptance behavior.

### 5. Todo List

Build a personal todo list with open, completed, and archived tasks.

Introduces:

- `value` declarations;
- `enum` declarations;
- `workflow` declarations;
- default field values;
- multiple behaviors and queries;
- workflow states and transitions;
- initial states;
- transition invariants;
- reusable domain values.

This stage should determine how workflows relate to entity fields and behavior
effects without duplicating the same fact.

### 6. Signup Form

Build an accessible account-signup form with field validation.

Introduces:

- `component` declarations;
- `requirement` declarations;
- structured inputs;
- validation errors;
- length and format constraints;
- loading, error, and success states;
- accessibility requirements;
- traceability from requirements to screens and components.

### 7. Private Notes

Build a notes application in which users can only access their own notes and
administrators can review reported notes.

Introduces:

- `policy` declarations;
- resource ownership;
- multiple actor roles;
- allow and deny rules;
- authorization failures;
- negative acceptance scenarios;
- policy references from behaviors, queries, and screens.

### 8. URL Shortener API

Build an HTTP API that creates short links and resolves them.

Introduces:

- `interface` declarations;
- HTTP operations;
- methods and paths;
- path parameters;
- response status mappings;
- unique fields;
- URL domain values;
- public and protected operations.

This stage should establish whether interface operations use contextual or fully
qualified references.

### 9. Reminder Service

Build a service that schedules reminders and sends notifications through an
external provider.

Introduces:

- `job` declarations;
- `integration` declarations;
- scheduled and event-triggered work;
- integration operations;
- timeouts and retry limits;
- idempotency;
- transient and permanent failure behavior;
- required secret names without secret values.

### 10. Expense Approval

Build an expense application with employee submission, manager approval limits,
and finance-administrator review.

Introduces:

- `decision` declarations;
- unresolved and proposed product decisions;
- money and decimal values;
- multi-step approval workflows;
- complex authorization rules;
- decisions that block implementation readiness;
- richer success and failure scenarios.

### 11. File Converter

Build an application that accepts a file, converts it using custom code, and
provides the result for download.

Introduces:

- `extension` declarations;
- binary values;
- external implementation contracts;
- extension inputs and outputs;
- implementation constraints;
- extension dependencies;
- timeout and failure behavior for custom capabilities.

### 12. Secure Document Vault

Build an encrypted document store for privacy-sensitive information.

Introduces:

- `constraint` declarations;
- sensitive fields;
- security and privacy categories;
- encryption requirements;
- retention obligations;
- verification guidance;
- trust boundaries and secret-management requirements.

### 13. Production Web Service

Deploy one of the earlier applications with explicit operational requirements.

Introduces:

- `deployment` declarations;
- environments and regions;
- data residency;
- availability targets;
- backups and recovery;
- scaling requirements;
- metrics, logs, traces, and alerting.

At the end of this stage, every standard Surface 0.1 declaration type should be
covered by at least one application.

### 14. Modular Help Desk

Build a help-desk application split across domain, behavior, interface, screen,
scenario, and operational files.

Introduces:

- imports;
- multi-file projects;
- project-wide reference resolution;
- duplicate declaration detection across files;
- import-cycle diagnostics;
- custom `x...` attributes;
- custom `x...` declaration types;
- preservation of unknown custom content.

### 15. Online Checkout

Build a checkout flow with baskets, stock reservations, payments, receipts, and
order fulfillment.

Exercises together:

- multiple related entities;
- payment and inventory integrations;
- chained workflows;
- asynchronous jobs;
- idempotent payment behavior;
- external failures and compensation;
- authorization policies;
- unresolved product decisions;
- complete API, UI, and scenario coverage.

This is the first capstone for the complete Surface 0.1 declaration model.

### 16. Multi-Tenant Project Tracker

Build a project tracker in which every resource belongs to a tenant and users
may belong to several tenants with different roles.

Tests:

- tenant isolation;
- cross-cutting policies;
- reusable concepts;
- large reference graphs;
- terminology consistency;
- requirement and constraint propagation;
- semantic impact analysis.

This application should expose whether namespaces, reusable templates, or
reference aliases are needed.

### 17. Collaborative Board

Build a shared board with live updates and intermittent offline use.

Tests future needs for:

- WebSocket interfaces;
- concurrent edits;
- conflict resolution;
- event ordering;
- offline behavior;
- synchronization and eventual consistency.

This application is expected to expose semantics beyond Surface 0.1 rather than
forcing concurrency behavior into controlled natural language indefinitely.

### 18. Bank Transfer System

Build an account-transfer system with immutable audit history.

Tests future needs for:

- transaction boundaries;
- consistency guarantees;
- idempotency keys;
- audit trails;
- failure recovery;
- compensating actions;
- precise invariants;
- executable policies and scenarios.

This application should drive formal condition, invariant, and transaction
semantics.

### 19. Production Reconstruction Benchmark

Specify and reconstruct a complete production-style application using only its
Surface project and pinned toolchain inputs.

Tests:

- implementation-task generation;
- API and database generation;
- UI scaffolding;
- test generation;
- infrastructure generation;
- semantic change analysis;
- reproducibility;
- conformance across independent generators.

This is the long-term measure of whether Surface can act as a stable application
specification rather than only a documentation format.

## Declaration Coverage

| Declaration type | First application |
| --- | --- |
| `application` | 1. Hello World Page |
| `screen` | 1. Hello World Page |
| `entity` | 3. Contact Viewer |
| `query` | 3. Contact Viewer |
| `actor` | 4. Click Counter |
| `behavior` | 4. Click Counter |
| `event` | 4. Click Counter |
| `scenario` | 4. Click Counter |
| `value` | 5. Todo List |
| `enum` | 5. Todo List |
| `workflow` | 5. Todo List |
| `component` | 6. Signup Form |
| `requirement` | 6. Signup Form |
| `policy` | 7. Private Notes |
| `interface` | 8. URL Shortener API |
| `job` | 9. Reminder Service |
| `integration` | 9. Reminder Service |
| `decision` | 10. Expense Approval |
| `extension` | 11. File Converter |
| `constraint` | 12. Secure Document Vault |
| `deployment` | 13. Production Web Service |

## Suggested Example Layout

Each roadmap application should live in its own numbered directory:

```text
examples/
    01-hello-world/
        surface.kdl
        expected-ir.json
        invalid/
            missing-application.kdl
            duplicate-application.kdl
    02-static-faq/
        surface.kdl
        expected-ir.json
        invalid/
    03-contact-viewer/
        surface.kdl
        expected-ir.json
        invalid/
```

Later applications may split their specification across multiple `.kdl` files.
Surface tooling identifies Surface documents by their `surface` node rather
than assuming that every KDL document belongs to Surface.
