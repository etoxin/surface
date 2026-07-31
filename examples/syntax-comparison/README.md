# Surface Host-Syntax Comparison

These files prototype the same subset of the Team Tasks application using four
possible host languages for Surface:

- [`teamTasks.kdl`](./teamTasks.kdl) uses KDL 2.0.
- [`teamTasks.hcl`](./teamTasks.hcl) uses HCL native syntax.
- [`teamTasks.yaml`](./teamTasks.yaml) uses YAML 1.2.
- [`teamTasks.json5`](./teamTasks.json5) uses JSON5.

They are design experiments, not valid Surface 0.1 files. The normative Surface
syntax remains defined by the repository's root `README.md`.

## Scope

Each prototype represents the same 14 Surface declaration types:

```text
application
actor
value
enum
entity
event
policy
behavior
query
workflow
interface
component
screen
scenario
```

Both prototypes include scalar attributes, repeated prose statements, nested
fields, references, workflow transitions, interface operations, response maps,
and scenarios.

## Measurements

Measurements include comments and formatting as committed:

| Measurement | KDL | HCL | YAML | JSON5 |
| --- | ---: | ---: | ---: | ---: |
| Total lines | 143 | 289 | 228 | 317 |
| Nonblank lines | 119 | 234 | 211 | 300 |
| Words | 479 | 693 | 503 | 633 |

The KDL prototype uses repeated child nodes for collections. For example:

```kdl
behavior taskComplete actor=member resource=task policy=taskComplete {
    requires "The task status is open."
    effect "Set the task status to completed."
    emits taskCompleted
}
```

The HCL prototype uses attributes for scalar collections and nested blocks for
structured collections:

```hcl
behavior "taskComplete" {
  actor    = actor.member
  resource = entity.task
  policy   = policy.taskComplete

  requires = [
    "The task status is open.",
  ]

  effects = [
    "Set the task status to completed.",
  ]

  emits = [event.taskCompleted]
}
```

The YAML prototype groups declarations by type and uses mappings for named
fields and nested declarations:

```yaml
behavior:
  taskComplete:
    actor: member
    resource: task
    policy: taskComplete
    requires:
      - The task status is open.
    effects:
      - Set the task status to completed.
    emits:
      - taskCompleted
```

The JSON5 prototype uses the same declaration-type maps as YAML while making
all structural delimiters explicit:

```json5
behavior: {
  taskComplete: {
    actor: 'member',
    resource: 'task',
    policy: 'taskComplete',
    requires: [
      'The task status is open.',
    ],
    effects: [
      'Set the task status to completed.',
    ],
    emits: [
      'taskCompleted',
    ],
  },
},
```

## Tradeoffs

### KDL

- Repeated nodes make fields, requirements, effects, and scenarios concise.
- Declaration identifiers and contextual references do not require quotes.
- The grammar supports comments, multiline strings, and source-oriented nodes.
- Boolean literals use the less familiar `#true` and `#false` spelling.
- Surface must define how each node argument and property maps to its IR.
- Contextual references require Surface schema validation after KDL parsing.

### HCL

- Blocks, assignments, lists, objects, and traversal references are familiar to
  Terraform users.
- Traversals such as `event.taskCompleted` provide a natural reference syntax.
- Nested blocks represent fields and operations without anonymous list objects.
- Quoted block labels and multiline list syntax add substantial vertical space.
- Surface would need to restrict HCL's broader expression language.
- Surface's natural-language statements remain assignment-heavy.

### YAML

- Many developers and editors already understand its basic mapping and list
  syntax.
- Keyed mappings make declaration and field identifiers reasonably compact.
- Booleans, numbers, strings, objects, and lists map directly to a Surface IR.
- Indentation carries structure, making misplaced whitespace semantically
  significant.
- References are indistinguishable from ordinary strings without a Surface
  convention or YAML tags.
- Grouping declarations by type loses the free declaration ordering of the
  current Surface document model.
- Prose lists require a key and a list marker for every statement.

### JSON5

- Its object, array, scalar, and Boolean model maps directly to a Surface IR.
- Comments, unquoted property names, single-quoted strings, and trailing commas
  make it friendlier to edit than strict JSON.
- Explicit braces and commas make structural boundaries independent of
  indentation.
- Declaration identifiers and references are ordinary object keys and strings,
  so Surface must define their meaning contextually.
- Repeated prose and nested declarations require considerable punctuation and
  vertical space.
- Grouping declarations by type has the same declaration-ordering limitation as
  the YAML prototype.

## Parser Check

All four files were parsed successfully with existing implementations:

- KDL: `@bgotink/kdl` 0.4.0
- HCL: `github.com/hashicorp/hcl/v2` 2.24.0
- YAML: `yaml` 2.9.0 in YAML 1.2 mode with unique-key checking
- JSON5: `json5` 2.2.3

These checks establish host-language syntax validity only. Surface-specific
schema and reference validation would still be implemented by Surface tooling.

## Current Result

For Surface's stated priority of human and LLM authoring, the KDL profile is the
stronger prototype. It expresses the same concepts with roughly half as many
nonblank lines while keeping declarations visually distinct.

HCL remains a credible alternative when Terraform familiarity, explicit typed
reference traversals, or the HCL ecosystem is more important than compactness.

YAML is the most immediately familiar option, but this prototype suggests that
familiarity does not translate into the simplest Surface authoring experience.
It is shorter than HCL but considerably more indentation-heavy than KDL, and it
needs an additional convention for references and declaration ordering.

JSON5 provides the most direct conventional object representation, which would
make parsing and IR conversion straightforward. In this comparison it is also
the longest representation, making it better suited to machine interchange or
generated specifications than primary human authoring.
