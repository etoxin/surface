# Surface Language Specification

**Status:** Initial draft
**Language version:** 0.1
**File extension:** `.surf`
**Character encoding:** UTF-8
**Purpose:** Human- and LLM-readable application specifications

---

# 1. Introduction

Surface Language is a lightweight specification language for describing the intended structure and behaviour of an application.

A Surface specification is intended to act as a stable source of product and application context between:

```text
human intent
    ↓
LLM interpretation
    ↓
software implementation
```

Surface Language 0.1 focuses on making application requirements:

* readable by humans;
* readable and writable by LLMs;
* structured enough to parse;
* suitable for source control;
* independent of programming frameworks;
* explicit about unresolved decisions;
* traceable across application layers.

Surface Language 0.1 is a specification language rather than an executable programming language.

It does not define how an application must be implemented. Instead, it describes what the application is expected to contain and how it is expected to behave.

---

# 2. Long-Term Direction

The long-term goal of Surface Language is to provide a stable application specification from which an application can be reconstructed.

A future Surface toolchain may support:

* semantic validation;
* executable policies;
* executable scenarios;
* code generation;
* database generation;
* user-interface generation;
* test generation;
* infrastructure generation;
* semantic change analysis;
* reproducible builds.

Surface Language 0.1 does not guarantee deterministic reconstruction.

Deterministic reconstruction would also require:

* versioned compilers and generators;
* pinned dependencies;
* controlled build environments;
* explicit implementation constraints;
* stable external interfaces;
* conformance tests;
* deterministic generation rules.

---

# 3. Design Goals

Surface Language 0.1 has the following primary goals.

## 3.1 Human Readability

A person should be able to understand the purpose and behaviour of a Surface declaration without specialist language training.

A human should be able to learn the full syntax quickly and easily.

## 3.2 LLM Readability

An LLM should be able to:

* read a Surface project;
* identify relevant declarations;
* add new declarations;
* modify existing declarations;
* preserve references;
* identify unresolved decisions;
* generate implementation tasks from the specification.

## 3.3 Framework Independence

A Surface specification should describe application intent without requiring a particular:

* frontend framework;
* backend framework;
* database;
* programming language;
* cloud provider;
* deployment platform.

Implementation-specific constraints may be recorded when they are genuine requirements.

## 3.4 Explicitness

Important application behaviour should be stated explicitly rather than assumed by an implementation agent.

## 3.5 Stable Source-Control Diffs

Surface files should produce readable textual changes when requirements evolve.

## 3.6 Gradual Formalisation

Version 0.1 permits controlled natural language.

Future versions may introduce formal expressions without requiring the entire language to become a general-purpose programming language.

---

# 4. Non-Goals

Surface Language 0.1 does not attempt to:

* execute application logic;
* define complete formal semantics;
* replace general-purpose programming languages;
* prescribe a software architecture;
* generate production-ready applications;
* guarantee bit-for-bit reproducible builds;
* define transaction behaviour;
* define concurrency behaviour;
* define database migration execution;
* define package distribution;
* define dependency resolution;
* define pixel-level visual design;
* prove that requirements are correct;
* remove the need for human review.

---

# 5. Normative Terms

The terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are used as normative requirements.

* **MUST** indicates an absolute requirement.
* **MUST NOT** indicates an absolute prohibition.
* **SHOULD** indicates a recommended practice.
* **SHOULD NOT** indicates a discouraged practice.
* **MAY** indicates an optional feature.

---

# 6. Surface Projects

A Surface project is a collection of one or more `.surf` files that together form one application specification.

A project MAY contain a single file:

```text
surface.surf
```

A larger project MAY use multiple files:

```text
surface.surf
domain/
    users.surf
    expenses.surf
behavior/
    submissions.surf
    approvals.surf
interface/
    api.surf
    screens.surf
scenarios/
    expense_lifecycle.surf
decisions.surf
```

A Surface project MUST contain exactly one `application` declaration.

---

# 7. File Header

Every `.surf` file MUST begin with a language-version declaration.

```surf
surface-lang 0.1
```

The version declaration MUST appear before imports or declarations.

A parser MUST reject files that do not contain a supported language version.

Example:

```surf
surface-lang 0.1

application expenseManager {
    name = "Expense Manager"
    version = "0.1.0"
    purpose = "Manage employee expenses."
}
```

---

# 8. Basic Structure

The fundamental unit of Surface Language is a declaration.

```surf
declarationType identifier {
    attribute = value
}
```

Example:

```surf
actor employee {
    name = "Employee"
    description = "A person who creates and submits expenses."
}
```

A declaration consists of:

1. a declaration type;
2. an identifier;
3. an opening brace;
4. zero or more attributes;
5. a closing brace.

---

# 9. Comments

Surface Language 0.1 supports single-line comments.

A comment begins with `//` and continues until the end of the line.

```surf
// This is a comment.

actor employee {
    name = "Employee" // Inline comments are permitted.
}
```

Comments MUST NOT affect the meaning of a specification.

Block comments are not supported in version 0.1.

---

# 10. Whitespace

Spaces, tabs, carriage returns, and line feeds are considered whitespace.

Whitespace MAY appear between tokens unless it would divide a string, number, identifier, or language keyword.

The following declarations are semantically equivalent:

```surf
actor employee {
    name = "Employee"
}
```

```surf
actor employee { name = "Employee" }
```

Canonical formatting rules are defined later in this specification.

---

# 11. Identifiers

Identifiers name declarations and object fields.

An identifier:

* MUST begin with an ASCII letter;
* MAY contain ASCII letters;
* MAY contain digits;
* MUST NOT contain underscores;
* MUST NOT contain spaces;
* MUST NOT contain periods;
* MUST NOT contain hyphens in version 0.1;
* is case-sensitive.

Valid identifiers:

```text
employee
expense
expenseSubmit
approvalPolicy
manager2
```

Invalid identifiers:

```text
2manager
expense.submit
expense-submit
expense submit
expense_submit
```

Identifiers SHOULD use lower camel case (`camelCase`).

Keywords MUST NOT be used as identifiers.

---

# 12. Keywords

The following words are reserved in Surface Language 0.1:

```text
surface-lang
import
true
false
null
```

Declaration types are not reserved globally, but tools SHOULD warn when custom declarations reuse standard declaration names incorrectly.

---

# 13. Attributes

An attribute assigns a value to a name.

```surf
name = "Employee"
```

Attribute names use the same syntax as identifiers.

An attribute MUST NOT occur more than once within the same declaration or object.

Invalid:

```surf
actor employee {
    name = "Employee"
    name = "Staff Member"
}
```

Tools MUST reject duplicate attributes.

---

# 14. Values

Surface Language 0.1 supports the following value types:

* strings;
* numbers;
* Booleans;
* null;
* identifiers;
* references;
* lists;
* objects.

---

# 15. Strings

Single-line strings use double quotation marks.

```surf
name = "Expense Manager"
```

Multiline strings use three double quotation marks.

```surf
purpose = """
Allow employees to submit business expenses
and managers to review eligible expenses.
"""
```

Supported escape sequences are:

```text
\"    double quotation mark
\\    backslash
\n    newline
\r    carriage return
\t    tab
```

Unknown escape sequences MUST produce a parsing error.

Strings are case-sensitive.

---

# 16. Numbers

Surface Language supports integers and decimal numbers.

```surf
maximumAttempts = 5
approvalLimit = 7500.00
minimumAmount = 0.01
temperature = -5
```

Numbers:

* MUST use a period as the decimal separator;
* MUST NOT contain grouping commas;
* MUST NOT contain unit symbols;
* MUST NOT use scientific notation in version 0.1.

Valid:

```text
0
14
-14
0.25
7500.00
```

Invalid:

```text
7,500
$20
20 AUD
1.2e6
```

Units and currencies SHOULD be represented using objects.

```surf
approvalLimit = {
    amount = 7500
    currency = "AUD"
}
```

---

# 17. Booleans

Boolean values are written as:

```surf
required = true
deprecated = false
```

Boolean values are lowercase and case-sensitive.

---

# 18. Null

The `null` value represents an explicitly absent value.

```surf
default = null
```

A missing attribute and an attribute assigned `null` are not necessarily equivalent.

Their semantic distinction is determined by the declaration definition or consuming tool.

---

# 19. Bare Identifier Values

An identifier MAY be used as a value.

```surf
kind = human
status = unresolved
priority = must
```

Bare identifier values are symbolic values.

They are not references and do not resolve to declarations.

Tools SHOULD use strings when a value is expected to contain arbitrary human-readable text.

---

# 20. Lists

Lists are ordered collections enclosed in square brackets.

```surf
roles = [
    @actor.employee,
    @actor.manager,
]
```

List items are separated by commas.

A trailing comma is permitted.

```surf
statuses = [
    "draft",
    "submitted",
    "approved",
]
```

Lists MAY contain mixed value types, although declaration definitions SHOULD restrict list contents where appropriate.

An empty list is valid.

```surf
errors = []
```

---

# 21. Objects

Objects are anonymous collections of attributes enclosed in braces.

```surf
amount = {
    type = "decimal"
    currency = "AUD"
    minimum = 0.01
}
```

Commas are not required between object attributes.

Objects do not have stable identities and cannot be directly referenced.

A concept that must be reused or referenced SHOULD be represented as a declaration.

---

# 22. References

A reference points to another declaration.

References begin with `@`.

Reference format:

```surf
@declarationType.identifier
```

Examples:

```surf
@actor.employee
@entity.expense
@event.expenseSubmitted
@behavior.expenseSubmit
```

The segment before the period identifies the declaration type.

The segment after the period identifies the declaration.

A reference MUST resolve to exactly one declaration within the project.

Forward references are permitted.

Example:

```surf
behavior expenseSubmit {
    emits = [
        @event.expenseSubmitted,
    ]
}

event expenseSubmitted {
    name = "Expense Submitted"
}
```

A parser MAY parse unresolved references, but project validation MUST report them as errors.

---

# 23. Imports

A Surface file MAY import declarations from another Surface file.

```surf
surface-lang 0.1

import "./domain/users.surf"
import "./domain/expenses.surf"
```

Imports MUST appear after the language-version declaration and before all declarations.

Import paths are relative to the importing file.

Imported files:

* MUST use the `.surf` extension;
* MUST declare a compatible Surface version;
* MUST exist;
* MUST NOT introduce circular imports.

The same file MAY be reachable through multiple import paths, but tools MUST process it only once per project.

Package imports and remote imports are not supported in version 0.1.

---

# 24. Declaration Types

Surface Language 0.1 defines the following standard declaration types:

```text
application
actor
entity
value
enum
event
behavior
query
policy
workflow
interface
screen
component
job
integration
scenario
decision
requirement
constraint
deployment
extension
```

Tools MAY support custom declaration types beginning with `x` followed by an
uppercase ASCII letter.

Example:

```surf
xAnalytics reporting {
    provider = "Example Analytics"
}
```

A custom declaration type MUST begin with `x` followed by an uppercase ASCII
letter, as in `xAnalytics`.

Unknown declaration types that do not use this prefix MUST produce a validation
error.

---

# 25. Application Declaration

A project MUST contain exactly one `application` declaration.

```surf
application expenseManager {
    name = "Expense Manager"
    version = "0.1.0"

    purpose = """
    Allow employees to create and submit expenses
    and managers to review eligible submissions.
    """

    specificationStatus = structuredDraft
    locale = "en-AU"
    timezone = "Australia/Sydney"
    defaultCurrency = "AUD"
}
```

## 25.1 Required Attributes

An `application` declaration MUST contain:

```text
name
version
purpose
```

## 25.2 Optional Attributes

An `application` declaration MAY contain:

```text
description
specificationStatus
locale
timezone
defaultCurrency
owners
repository
documentation
tags
```

## 25.3 Specification Status

The recommended `specificationStatus` values are:

```text
concept
structuredDraft
prototypeReady
implementationReady
productionReview
```

These values describe maturity only. They do not guarantee completeness or correctness.

---

# 26. Actor Declaration

An `actor` represents a person, role, service, system, or external participant that interacts with the application.

```surf
actor employee {
    name = "Employee"
    kind = human

    description = """
    A person who creates and submits business expenses.
    """

    responsibilities = [
        "Create expenses.",
        "Upload receipts.",
        "Submit completed expenses.",
    ]
}
```

## 26.1 Recommended Attributes

```text
name
kind
description
responsibilities
```

## 26.2 Actor Kinds

Recommended actor kinds are:

```text
human
system
service
external
```

Example:

```surf
actor paymentProvider {
    name = "Payment Provider"
    kind = external
}
```

---

# 27. Entity Declaration

An `entity` represents application data with a stable identity.

```surf
entity expense {
    name = "Expense"
    description = "A business expense created by an employee."

    fields = [
        {
            id = "id"
            type = "uuid"
            required = true
            generated = true
        },
        {
            id = "amount"
            type = "money"
            required = true
            minimum = 0.01
            currency = "AUD"
        },
        {
            id = "status"
            type = @enum.expenseStatus
            required = true
            default = "draft"
        },
        {
            id = "owner"
            type = @entity.user
            required = true
        },
    ]
}
```

## 27.1 Required Attributes

An `entity` declaration MUST contain:

```text
fields
```

## 27.2 Field Objects

Each field object MUST contain:

```text
id
type
```

A field object MAY contain:

```text
name
description
required
default
generated
unique
minimum
maximum
minimumLength
maximumLength
sensitive
deprecated
examples
```

Field identifiers MUST be unique within the entity.

## 27.3 Field Types

A field type MAY be:

* a string naming a primitive type;
* a reference to an `enum`;
* a reference to a `value`;
* a reference to another `entity`.

Recommended primitive type names include:

```text
string
integer
decimal
boolean
uuid
date
time
timestamp
duration
json
binary
money
email
url
```

Primitive types are descriptive in version 0.1 and do not yet have normative runtime semantics.

---

# 28. Value Declaration

A `value` represents a reusable domain value without an independent application identity.

```surf
value emailAddress {
    name = "Email Address"
    base = "string"

    constraints = [
        "The value must contain a valid email address.",
        "The value must be stored in canonical lowercase form.",
    ]
}
```

Recommended uses include:

* email addresses;
* monetary values;
* percentages;
* phone numbers;
* postal addresses;
* date ranges;
* identifiers.

Recommended attributes:

```text
name
description
base
constraints
examples
```

---

# 29. Enum Declaration

An `enum` declares a fixed set of allowed symbolic values.

```surf
enum expenseStatus {
    values = [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "reimbursed",
    ]
}
```

An `enum` declaration MUST contain a non-empty `values` list.

Enum values:

* MUST be strings;
* MUST be unique within the enum;
* are case-sensitive.

---

# 30. Event Declaration

An `event` represents something that has occurred within or outside the application.

```surf
event expenseSubmitted {
    name = "Expense Submitted"

    payload = [
        {
            id = "expense"
            type = @entity.expense
            required = true
        },
        {
            id = "submittedBy"
            type = @entity.user
            required = true
        },
    ]
}
```

Recommended attributes:

```text
name
description
payload
source
consumers
```

Each payload field SHOULD follow the same structure as an entity field.

---

# 31. Behavior Declaration

A `behavior` describes an operation that may change application state or cause an external effect.

```surf
behavior expenseSubmit {
    name = "Submit Expense"

    actor = @actor.employee
    resource = @entity.expense
    policy = @policy.expenseSubmit

    inputs = [
        {
            id = "expense"
            type = @entity.expense
            required = true
        },
    ]

    preconditions = [
        "The actor owns the expense.",
        "The expense status is draft.",
        "The expense amount is greater than zero.",
    ]

    effects = [
        "Set the expense status to submitted.",
        "Record the submission timestamp.",
        "Emit the expenseSubmitted event.",
    ]

    emits = [
        @event.expenseSubmitted,
    ]

    errors = [
        "expenseNotFound",
        "permissionDenied",
        "invalidExpenseState",
        "validationFailed",
    ]

    idempotent = false
}
```

## 31.1 Recommended Attributes

```text
name
description
actor
resource
inputs
preconditions
effects
emits
errors
policy
idempotent
requirements
```

## 31.2 Preconditions

`preconditions` describe conditions that must be satisfied before the behavior can succeed.

Preconditions SHOULD NOT be used as a substitute for authorization policies when the condition controls access.

## 31.3 Effects

`effects` describe observable state changes or external effects caused by successful behavior execution.

## 31.4 Errors

Errors are symbolic names in version 0.1.

Error identifiers SHOULD use lower camel case (`camelCase`).

---

# 32. Query Declaration

A `query` describes an operation that retrieves information without intentionally changing application state.

```surf
query expenseGet {
    name = "Get Expense"

    actor = @actor.employee

    inputs = [
        {
            id = "expenseId"
            type = "uuid"
            required = true
        },
    ]

    returns = {
        type = @entity.expense
        nullable = true
    }

    requirements = [
        "Return the expense matching the supplied identifier.",
        "Apply the expenseView policy.",
        "Return null when the expense does not exist.",
    ]

    policy = @policy.expenseView
}
```

Recommended attributes:

```text
name
description
actor
inputs
returns
requirements
policy
errors
```

Queries SHOULD describe observable retrieval behaviour rather than database implementation details.

---

# 33. Policy Declaration

A `policy` describes whether an actor may perform an action or access a resource.

```surf
policy expenseApprove {
    name = "Approve Expense"

    actor = @actor.manager
    resource = @entity.expense
    action = "approve"

    allowWhen = [
        "The actor is a finance administrator.",
        "Or the actor manages the expense's team and the expense amount is at most AUD 5,000.",
    ]

    denyWhen = [
        "The expense status is not submitted.",
    ]
}
```

Recommended attributes:

```text
name
description
actor
resource
action
allowWhen
denyWhen
requirements
```

Policy rules are controlled natural-language statements in version 0.1.

If both `allowWhen` and `denyWhen` are present, explicit denial SHOULD take precedence unless the specification states otherwise.

Formal policy evaluation is not defined in version 0.1.

---

# 34. Workflow Declaration

A `workflow` describes states and transitions associated with a process or entity lifecycle.

```surf
workflow expenseLifecycle {
    name = "Expense Lifecycle"
    entity = @entity.expense

    states = [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "reimbursed",
    ]

    initialState = "draft"

    transitions = [
        {
            id = "submit"
            from = "draft"
            to = "submitted"
            behavior = @behavior.expenseSubmit
        },
        {
            id = "approve"
            from = "submitted"
            to = "approved"
            behavior = @behavior.expenseApprove
        },
    ]

    invariants = [
        "A reimbursed expense must have a reimbursement reference.",
    ]
}
```

## 34.1 Required Attributes

A workflow MUST contain:

```text
states
initialState
transitions
```

## 34.2 Transition Objects

Each transition MUST contain:

```text
id
from
to
```

A transition MAY contain:

```text
behavior
policy
conditions
effects
```

Transition identifiers MUST be unique within the workflow.

The `initialState` MUST appear in the `states` list.

Each `from` and `to` state MUST appear in the `states` list.

---

# 35. Interface Declaration

An `interface` describes how application capabilities are exposed.

```surf
interface expenseApi {
    name = "Expense API"
    kind = http
    basePath = "/api"

    operations = [
        {
            id = "submitExpense"
            method = "POST"
            path = "/expenses/{expenseId}/submit"
            behavior = @behavior.expenseSubmit

            responses = {
                success = 200
                notFound = 404
                permissionDenied = 403
                invalidState = 409
            }
        },
    ]
}
```

Recommended interface kinds are:

```text
http
event
commandLine
internal
websocket
```

Recommended attributes:

```text
name
description
kind
basePath
authentication
operations
requirements
```

Each operation object MUST contain an `id`.

Operation identifiers MUST be unique within the interface.

HTTP-specific semantics are descriptive in version 0.1.

---

# 36. Screen Declaration

A `screen` describes a user-facing application surface.

```surf
screen expenseDetails {
    name = "Expense Details"
    route = "/expenses/:expenseId"

    actors = [
        @actor.employee,
        @actor.manager,
    ]

    data = [
        @query.expenseGet,
    ]

    sections = [
        "Expense summary",
        "Receipt preview",
        "Approval history",
    ]

    actions = [
        {
            label = "Submit Expense"
            behavior = @behavior.expenseSubmit
            policy = @policy.expenseSubmit
            visibleWhen = "The expense status is draft."
        },
    ]

    states = {
        loading = "Display a loading placeholder."
        empty = "Display an empty-state explanation."
        notFound = "Display the not-found screen."
        error = "Display an error message and retry action."
    }

    requirements = [
        "All actions must be keyboard accessible.",
        "Validation errors must identify the affected field.",
    ]
}
```

Recommended attributes:

```text
name
description
route
actors
data
sections
components
actions
states
requirements
```

Version 0.1 describes screen intent and observable behaviour rather than exact visual layout.

---

# 37. Component Declaration

A `component` describes a reusable user-interface concept.

```surf
component statusBadge {
    name = "Status Badge"

    inputs = [
        {
            id = "status"
            type = @enum.expenseStatus
            required = true
        },
    ]

    requirements = [
        "Display the current status as text.",
        "Do not communicate status using colour alone.",
    ]
}
```

Recommended attributes:

```text
name
description
inputs
outputs
states
actions
requirements
accessibility
```

---

# 38. Job Declaration

A `job` describes background processing.

```surf
job sendExpenseNotification {
    name = "Send Expense Notification"
    triggeredBy = @event.expenseSubmitted

    requirements = [
        "Notify the manager responsible for the expense's team.",
        "Do not send the same notification more than once.",
    ]

    maximumAttempts = 5
    idempotent = true
}
```

Recommended attributes:

```text
name
description
triggeredBy
schedule
requirements
effects
maximumAttempts
timeoutSeconds
idempotent
failureBehavior
```

Scheduling syntax is not formally defined in version 0.1.

---

# 39. Integration Declaration

An `integration` describes an external service, platform, or dependency.

```surf
integration emailService {
    name = "Email Service"
    kind = externalService

    operations = [
        {
            id = "sendEmail"

            inputs = [
                "recipient",
                "template",
                "variables",
            ]

            timeoutSeconds = 10
            maximumAttempts = 4
            idempotent = true
        },
    ]

    failureBehavior = [
        "Retry temporary failures.",
        "Record permanent failures for manual review.",
    ]
}
```

Recommended attributes:

```text
name
description
kind
provider
operations
authentication
failureBehavior
requirements
```

Secrets MUST NOT be stored directly in a Surface specification.

A specification MAY describe required secret names or secret categories.

---

# 40. Scenario Declaration

A `scenario` describes observable acceptance behaviour.

```surf
scenario managerApprovesSmallExpense {
    name = "Manager approves an eligible expense"

    relatesTo = [
        @behavior.expenseApprove,
        @policy.expenseApprove,
    ]

    given = [
        "The actor is a manager for Team A.",
        "The expense belongs to Team A.",
        "The expense amount is AUD 3,200.",
        "The expense status is submitted.",
    ]

    when = [
        "The actor approves the expense.",
    ]

    then = [
        "The expense status becomes approved.",
        "The approving manager is recorded.",
        "Exactly one expenseApproved event is emitted.",
    ]
}
```

## 40.1 Required Attributes

A scenario MUST contain:

```text
given
when
then
```

## 40.2 Scenario Guidance

Scenarios SHOULD:

* describe observable behaviour;
* avoid implementation details;
* use specific values where useful;
* describe one principal behaviour;
* reference related declarations;
* include meaningful failure scenarios where relevant.

Version 0.1 scenarios are descriptive and are not directly executable.

---

# 41. Decision Declaration

A `decision` records an unresolved, proposed, confirmed, rejected, or superseded product decision.

```surf
decision receiptThreshold {
    status = unresolved

    question = """
    Above what amount must an employee provide a receipt?
    """

    options = [
        "AUD 50",
        "AUD 75",
        "AUD 100",
        "A receipt is always required.",
    ]

    affects = [
        @entity.expense,
        @behavior.expenseSubmit,
        @screen.expenseDetails,
    ]

    blocks = [
        "implementationReady",
    ]
}
```

## 41.1 Decision Status

Allowed status values are:

```text
unresolved
proposed
confirmed
rejected
superseded
```

A decision with status `confirmed` SHOULD contain a `resolution` attribute.

```surf
decision receiptThreshold {
    status = confirmed
    question = "Above what amount is a receipt required?"
    resolution = "A receipt is required for expenses above AUD 75."
}
```

A decision with status `superseded` SHOULD reference or name the replacing decision.

Recommended attributes:

```text
status
question
context
options
proposal
resolution
rationale
affects
blocks
source
```

---

# 42. Requirement Declaration

A `requirement` records a traceable product, business, user, or technical requirement.

```surf
requirement receiptAccessibility {
    title = "Receipt accessibility"

    statement = """
    Receipt previews must be keyboard accessible
    and must include an accessible text description.
    """

    priority = must

    affects = [
        @screen.expenseDetails,
    ]

    source = "Accessibility review AR-14"
}
```

## 42.1 Requirement Priorities

Recommended priority values are:

```text
must
should
may
wont
```

Recommended attributes:

```text
title
statement
priority
source
rationale
affects
acceptance
status
```

Requirements SHOULD describe one independently reviewable obligation.

---

# 43. Constraint Declaration

A `constraint` records a system-wide limitation, obligation, or boundary.

```surf
constraint supportedBrowsers {
    category = compatibility

    statement = """
    The web application must support the current and previous
    major versions of Chrome, Firefox, Safari, and Edge.
    """
}
```

Recommended categories include:

```text
security
privacy
performance
accessibility
compatibility
legal
operational
technical
dataResidency
```

Recommended attributes:

```text
category
statement
rationale
source
affects
verification
```

---

# 44. Deployment Declaration

A `deployment` describes deployment intent and operational requirements.

```surf
deployment production {
    name = "Production"
    environment = production
    region = "australia-southeast"

    requirements = [
        "Application data must remain within Australia.",
        "The service must run with at least two application instances.",
        "The database must be backed up daily.",
    ]
}
```

Recommended attributes:

```text
name
environment
provider
region
requirements
services
dataResidency
availability
backup
recovery
observability
```

Version 0.1 does not define provider-specific infrastructure semantics.

---

# 45. Extension Declaration

An `extension` describes behaviour or capability implemented outside the Surface specification.

```surf
extension fraudDetection {
    name = "Fraud Detection"
    purpose = "Calculate the fraud risk of an expense."

    interface = {
        input = @entity.expense
        output = "riskScore"
    }

    requirements = [
        "Return a score between 0 and 100.",
        "Complete within 500 milliseconds.",
        "Do not modify the expense.",
    ]
}
```

Recommended attributes:

```text
name
purpose
interface
requirements
effects
dependencies
implementationConstraints
failureBehavior
```

An extension SHOULD define a clear contract even when its implementation is external or custom.

---

# 46. Controlled Natural Language

Surface Language 0.1 allows controlled natural-language statements in attributes such as:

* `requirements`;
* `preconditions`;
* `effects`;
* `allowWhen`;
* `denyWhen`;
* `given`;
* `when`;
* `then`;
* `constraints`;
* `failureBehavior`.

These statements SHOULD:

* describe one requirement at a time;
* use direct language;
* identify relevant actors or resources;
* avoid subjective terms;
* avoid vague qualifiers;
* state measurable conditions where possible;
* avoid implementation details unless required;
* use consistent terminology.

Weak:

```surf
requirements = [
    "The page should be user-friendly.",
]
```

Better:

```surf
requirements = [
    "A keyboard user must be able to reach every action.",
    "Validation errors must identify the affected field.",
    "The primary action must remain visible at widths of 320 pixels or greater.",
]
```

Weak:

```surf
effects = [
    "Handle the expense.",
]
```

Better:

```surf
effects = [
    "Set the expense status to submitted.",
    "Record the submission timestamp.",
    "Emit the expenseSubmitted event.",
]
```

---

# 47. Terminology Consistency

A Surface project SHOULD use one term consistently for each domain concept.

For example, a project SHOULD NOT use all of the following to mean the same thing:

```text
customer
client
account holder
subscriber
```

A value or entity declaration SHOULD be introduced where a domain term requires a stable definition.

LLMs and tooling SHOULD prefer existing terminology over inventing synonyms.

---

# 48. Unresolved Information

A Surface specification MUST NOT silently represent an unresolved product decision as confirmed behaviour.

Unresolved information SHOULD be recorded using a `decision` declaration.

Example:

```surf
decision failedPaymentBehavior {
    status = unresolved

    question = "What should happen after a payment fails?"

    options = [
        "Retain the basket.",
        "Clear the basket.",
        "Retain the basket for 24 hours.",
    ]

    affects = [
        @workflow.checkout,
        @screen.paymentFailure,
    ]
}
```

An implementation agent MAY generate a prototype around unresolved decisions only when the chosen temporary behaviour is clearly marked as an assumption.

---

# 49. Assumptions

Surface Language 0.1 does not define a dedicated `assumption` declaration.

Temporary assumptions MAY be represented as decisions with status `proposed`.

```surf
decision temporaryReceiptThreshold {
    status = proposed
    question = "What receipt threshold should be used for the prototype?"
    proposal = "Use AUD 75 until the finance team confirms the threshold."
}
```

Tools SHOULD clearly distinguish proposed decisions from confirmed decisions.

---

# 50. Unknown Attributes

Standard declarations MAY contain custom attributes beginning with `x` followed
by an uppercase ASCII letter.

```surf
entity expense {
    fields = []

    xDatabaseTable = "business_expenses"
    xOwnerTeam = "finance_platform"
}
```

Custom attributes:

* MUST begin with `x` followed by an uppercase ASCII letter;
* MUST be preserved by formatters and editors;
* MUST NOT be assigned standard meaning by generic Surface tools.

Unknown attributes without this prefix SHOULD produce a warning.

They SHOULD NOT produce a parsing error.

---

# 51. Custom Declarations

A project MAY define custom declaration types beginning with `x` followed by an
uppercase ASCII letter.

```surf
xMetric monthlyActiveUsers {
    description = "Unique active users during a calendar month."
}
```

Generic Surface tools MUST preserve custom declarations.

Generic Surface tools are not required to validate their internal attributes.

---

# 52. Declaration Identity

The stable identity of a declaration in version 0.1 is the combination of:

```text
declaration type
+
identifier
```

Example:

```text
entity.expense
behavior.expenseSubmit
screen.expenseDetails
```

Declaration identifiers MUST be unique within each declaration type.

The following is valid:

```surf
entity expense {
    fields = []
}

screen expense {
    name = "Expense"
}
```

The following is invalid:

```surf
entity expense {
    fields = []
}

entity expense {
    fields = []
}
```

Renaming a declaration changes its identity in version 0.1.

A future version may introduce immutable stable identifiers.

---

# 53. Declaration Ordering

Declaration order does not affect the intended meaning of a Surface project.

Forward references are permitted.

Authors SHOULD order declarations for readability.

A recommended order is:

```text
application
actors
values
enums
entities
events
policies
behaviors
queries
workflows
integrations
jobs
interfaces
components
screens
scenarios
requirements
constraints
decisions
deployments
extensions
```

Formatters MUST NOT reorder declarations automatically in version 0.1.

---

# 54. Canonical Formatting

A canonical Surface formatter SHOULD use:

* UTF-8 encoding;
* four spaces for indentation;
* no tab characters;
* one attribute per line;
* one blank line between declarations;
* double-quoted strings;
* triple-quoted multiline strings;
* trailing commas in multiline lists;
* lower camel case (`camelCase`) identifiers;
* original declaration order;
* original attribute order;
* a final newline at the end of each file.

Example:

```surf
actor employee {
    name = "Employee"
    kind = human

    responsibilities = [
        "Create expenses.",
        "Submit expenses.",
    ]
}
```

A formatter MUST preserve comments where reasonably possible.

A formatter MUST preserve unknown attributes and custom declarations.

---

# 55. Validation

A Surface 0.1 validator MUST check:

1. The language-version declaration is present.
2. The language version is supported.
3. The file conforms to the grammar.
4. The project contains exactly one application declaration.
5. Declaration identifiers follow the identifier rules.
6. Declaration identities are unique.
7. Attributes are not duplicated.
8. All references resolve.
9. Reference declaration types match their targets.
10. Imported files exist.
11. Imports do not form cycles.
12. Required declaration attributes are present.
13. Enum values are unique.
14. Entity field identifiers are unique.
15. Workflow state references are valid.
16. Workflow transition identifiers are unique.
17. Scenario declarations contain `given`, `when`, and `then`.
18. Decision statuses are recognised.
19. Custom declaration types begin with `x` followed by an uppercase ASCII letter.
20. Custom attributes begin with `x` followed by an uppercase ASCII letter.

A validator SHOULD warn about:

* empty descriptions;
* vague natural-language statements;
* unused declarations;
* behaviors without policies where authorization appears necessary;
* screens referencing undefined loading or error behaviour;
* unresolved decisions that block implementation;
* entities with no fields;
* events with no payload description;
* scenarios with no related declarations;
* inconsistent terminology;
* requirements with no affected declarations;
* behaviors with effects but no scenarios;
* extension contracts that omit failure behaviour.

---

# 56. Diagnostics

Diagnostics SHOULD be readable by both humans and LLMs.

A diagnostic SHOULD contain:

```text
severity
code
message
file
line
column
related declaration
suggested correction
```

Example:

```text
Error SURF-REF-001

Unknown reference @event.expenseApproved.

File:
behavior/approvals.surf

Declaration:
behavior.expenseApprove

Suggested correction:
Declare event expenseApproved or update the reference.
```

Tools MAY also produce structured diagnostics.

```json
{
  "severity": "error",
  "code": "SURF-REF-001",
  "message": "Unknown reference @event.expenseApproved.",
  "file": "behavior/approvals.surf",
  "line": 24,
  "column": 9,
  "declaration": "behavior.expenseApprove"
}
```

---

# 57. Grammar

The following simplified EBNF defines the Surface Language 0.1 source grammar.

```ebnf
document =
    versionDeclaration,
    { importDeclaration },
    { declaration } ;

versionDeclaration =
    "surface-lang", whitespace, versionNumber ;

versionNumber =
    digit, { digit }, ".", digit, { digit } ;

importDeclaration =
    "import", whitespace, string ;

declaration =
    identifier, whitespace, identifier, whitespace, block ;

block =
    "{", { attribute }, "}" ;

attribute =
    identifier, optionalWhitespace, "=",
    optionalWhitespace, value ;

value =
      string
    | number
    | boolean
    | null
    | reference
    | identifier
    | list
    | object ;

list =
    "[",
    [ value, { ",", value }, [ "," ] ],
    "]" ;

object =
    "{", { attribute }, "}" ;

reference =
    "@", identifier, ".", identifier ;

boolean =
      "true"
    | "false" ;

null =
    "null" ;

identifier =
    letter, { letter | digit } ;

number =
    [ "-" ],
    digit, { digit },
    [ ".", digit, { digit } ] ;

string =
      quotedString
    | multilineString ;

quotedString =
    '"',
    { stringCharacter | escapeSequence },
    '"' ;

multilineString =
    '"""',
    { multilineCharacter },
    '"""' ;

escapeSequence =
      '\"'
    | '\\'
    | '\n'
    | '\r'
    | '\t' ;

letter =
      "A" | "B" | "C" | "D" | "E" | "F"
    | "G" | "H" | "I" | "J" | "K" | "L"
    | "M" | "N" | "O" | "P" | "Q" | "R"
    | "S" | "T" | "U" | "V" | "W" | "X"
    | "Y" | "Z"
    | "a" | "b" | "c" | "d" | "e" | "f"
    | "g" | "h" | "i" | "j" | "k" | "l"
    | "m" | "n" | "o" | "p" | "q" | "r"
    | "s" | "t" | "u" | "v" | "w" | "x"
    | "y" | "z" ;

digit =
      "0" | "1" | "2" | "3" | "4"
    | "5" | "6" | "7" | "8" | "9" ;
```

Comments and whitespace may appear between tokens.

This grammar is informative and may be refined when the first parser is implemented.

---

# 58. Complete Example

```surf
surface-lang 0.1

application expenseManager {
    name = "Expense Manager"
    version = "0.1.0"

    purpose = """
    Allow employees to create and submit business expenses
    and managers to review eligible submissions.
    """

    specificationStatus = structuredDraft
    locale = "en-AU"
    timezone = "Australia/Sydney"
    defaultCurrency = "AUD"
}

actor employee {
    name = "Employee"
    kind = human

    responsibilities = [
        "Create expenses.",
        "Upload receipts.",
        "Submit completed expenses.",
    ]
}

actor manager {
    name = "Manager"
    kind = human

    responsibilities = [
        "Review expenses belonging to the manager's team.",
        "Approve or reject eligible expenses.",
    ]
}

actor financeAdministrator {
    name = "Finance Administrator"
    kind = human

    responsibilities = [
        "Review expenses across all teams.",
        "Approve expenses above manager limits.",
        "Manage reimbursements.",
    ]
}

enum expenseStatus {
    values = [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "reimbursed",
    ]
}

entity user {
    name = "User"

    fields = [
        {
            id = "id"
            type = "uuid"
            required = true
            generated = true
        },
        {
            id = "name"
            type = "string"
            required = true
        },
        {
            id = "email"
            type = "email"
            required = true
            unique = true
        },
        {
            id = "role"
            type = "string"
            required = true
        },
        {
            id = "teamId"
            type = "uuid"
            required = false
        },
    ]
}

entity expense {
    name = "Expense"

    fields = [
        {
            id = "id"
            type = "uuid"
            required = true
            generated = true
        },
        {
            id = "owner"
            type = @entity.user
            required = true
        },
        {
            id = "teamId"
            type = "uuid"
            required = true
        },
        {
            id = "description"
            type = "string"
            required = true
            maximumLength = 500
        },
        {
            id = "amount"
            type = "money"
            currency = "AUD"
            required = true
            minimum = 0.01
        },
        {
            id = "status"
            type = @enum.expenseStatus
            required = true
            default = "draft"
        },
        {
            id = "submittedAt"
            type = "timestamp"
            required = false
        },
        {
            id = "approvedAt"
            type = "timestamp"
            required = false
        },
        {
            id = "approvedBy"
            type = @entity.user
            required = false
        },
    ]
}

event expenseSubmitted {
    name = "Expense Submitted"

    payload = [
        {
            id = "expense"
            type = @entity.expense
            required = true
        },
        {
            id = "submittedBy"
            type = @entity.user
            required = true
        },
    ]
}

event expenseApproved {
    name = "Expense Approved"

    payload = [
        {
            id = "expense"
            type = @entity.expense
            required = true
        },
        {
            id = "approvedBy"
            type = @entity.user
            required = true
        },
    ]
}

policy expenseView {
    name = "View Expense"
    actor = @actor.employee
    resource = @entity.expense
    action = "view"

    allowWhen = [
        "The actor owns the expense.",
        "The actor manages the expense's team.",
        "The actor is a finance administrator.",
    ]
}

policy expenseSubmit {
    name = "Submit Expense"
    actor = @actor.employee
    resource = @entity.expense
    action = "submit"

    allowWhen = [
        "The actor owns the expense.",
    ]

    denyWhen = [
        "The expense status is not draft.",
    ]
}

policy expenseApprove {
    name = "Approve Expense"
    actor = @actor.manager
    resource = @entity.expense
    action = "approve"

    allowWhen = [
        "The actor is a finance administrator.",
        "The actor manages the expense's team and the expense amount is at most AUD 5,000.",
    ]

    denyWhen = [
        "The expense status is not submitted.",
    ]
}

behavior expenseSubmit {
    name = "Submit Expense"

    actor = @actor.employee
    resource = @entity.expense
    policy = @policy.expenseSubmit

    inputs = [
        {
            id = "expense"
            type = @entity.expense
            required = true
        },
    ]

    preconditions = [
        "The expense amount is greater than zero.",
        "All required expense fields are present.",
    ]

    effects = [
        "Set the expense status to submitted.",
        "Record the current timestamp as submittedAt.",
        "Emit the expenseSubmitted event.",
    ]

    emits = [
        @event.expenseSubmitted,
    ]

    errors = [
        "expenseNotFound",
        "permissionDenied",
        "invalidExpenseState",
        "validationFailed",
    ]

    idempotent = false
}

behavior expenseApprove {
    name = "Approve Expense"

    actor = @actor.manager
    resource = @entity.expense
    policy = @policy.expenseApprove

    inputs = [
        {
            id = "expense"
            type = @entity.expense
            required = true
        },
    ]

    preconditions = [
        "The expense status is submitted.",
    ]

    effects = [
        "Set the expense status to approved.",
        "Record the approving actor.",
        "Record the current timestamp as approvedAt.",
        "Emit the expenseApproved event.",
    ]

    emits = [
        @event.expenseApproved,
    ]

    errors = [
        "expenseNotFound",
        "permissionDenied",
        "invalidExpenseState",
    ]

    idempotent = false
}

query expenseGet {
    name = "Get Expense"

    actor = @actor.employee

    inputs = [
        {
            id = "expenseId"
            type = "uuid"
            required = true
        },
    ]

    returns = {
        type = @entity.expense
        nullable = true
    }

    requirements = [
        "Return the expense matching the supplied identifier.",
        "Apply the expenseView policy.",
        "Return null when the expense does not exist.",
    ]

    policy = @policy.expenseView
}

workflow expenseLifecycle {
    name = "Expense Lifecycle"
    entity = @entity.expense

    states = [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "reimbursed",
    ]

    initialState = "draft"

    transitions = [
        {
            id = "submit"
            from = "draft"
            to = "submitted"
            behavior = @behavior.expenseSubmit
        },
        {
            id = "approve"
            from = "submitted"
            to = "approved"
            behavior = @behavior.expenseApprove
        },
    ]

    invariants = [
        "An approved expense must have an approvedAt timestamp.",
        "An approved expense must identify the approving actor.",
        "A reimbursed expense must have a reimbursement reference.",
    ]
}

interface expenseApi {
    name = "Expense API"
    kind = http
    basePath = "/api"

    operations = [
        {
            id = "getExpense"
            method = "GET"
            path = "/expenses/{expenseId}"
            query = @query.expenseGet

            responses = {
                success = 200
                notFound = 404
                permissionDenied = 403
            }
        },
        {
            id = "submitExpense"
            method = "POST"
            path = "/expenses/{expenseId}/submit"
            behavior = @behavior.expenseSubmit

            responses = {
                success = 200
                notFound = 404
                permissionDenied = 403
                invalidState = 409
                validationFailed = 422
            }
        },
        {
            id = "approveExpense"
            method = "POST"
            path = "/expenses/{expenseId}/approve"
            behavior = @behavior.expenseApprove

            responses = {
                success = 200
                notFound = 404
                permissionDenied = 403
                invalidState = 409
            }
        },
    ]
}

component statusBadge {
    name = "Status Badge"

    inputs = [
        {
            id = "status"
            type = @enum.expenseStatus
            required = true
        },
    ]

    requirements = [
        "Display the current status as text.",
        "Do not communicate status using colour alone.",
    ]
}

screen expenseDetails {
    name = "Expense Details"
    route = "/expenses/:expenseId"

    actors = [
        @actor.employee,
        @actor.manager,
        @actor.financeAdministrator,
    ]

    data = [
        @query.expenseGet,
    ]

    sections = [
        "Expense summary",
        "Receipt preview",
        "Approval history",
    ]

    components = [
        @component.statusBadge,
    ]

    actions = [
        {
            label = "Submit Expense"
            behavior = @behavior.expenseSubmit
            policy = @policy.expenseSubmit
            visibleWhen = "The expense status is draft."
        },
        {
            label = "Approve Expense"
            behavior = @behavior.expenseApprove
            policy = @policy.expenseApprove
            visibleWhen = "The expense status is submitted."
        },
    ]

    states = {
        loading = "Display a loading placeholder."
        empty = "Not applicable."
        notFound = "Display the not-found screen."
        error = "Display an error message and retry action."
    }

    requirements = [
        "All actions must be keyboard accessible.",
        "Validation errors must identify the affected field.",
    ]
}

job sendSubmissionNotification {
    name = "Send Submission Notification"
    triggeredBy = @event.expenseSubmitted

    requirements = [
        "Notify the manager responsible for the expense's team.",
        "Do not send the same notification more than once.",
    ]

    maximumAttempts = 5
    idempotent = true
}

scenario employeeSubmitsDraftExpense {
    name = "Employee submits a draft expense"

    relatesTo = [
        @behavior.expenseSubmit,
        @policy.expenseSubmit,
        @workflow.expenseLifecycle,
    ]

    given = [
        "The employee owns the expense.",
        "The expense amount is AUD 120.",
        "The expense status is draft.",
        "All required fields are present.",
    ]

    when = [
        "The employee submits the expense.",
    ]

    then = [
        "The expense status becomes submitted.",
        "The submission timestamp is recorded.",
        "Exactly one expenseSubmitted event is emitted.",
    ]
}

scenario managerApprovesSmallExpense {
    name = "Manager approves an eligible expense"

    relatesTo = [
        @behavior.expenseApprove,
        @policy.expenseApprove,
        @workflow.expenseLifecycle,
    ]

    given = [
        "The actor is a manager for Team A.",
        "The expense belongs to Team A.",
        "The expense amount is AUD 3,200.",
        "The expense status is submitted.",
    ]

    when = [
        "The actor approves the expense.",
    ]

    then = [
        "The expense status becomes approved.",
        "The approving manager is recorded.",
        "The approval timestamp is recorded.",
        "Exactly one expenseApproved event is emitted.",
    ]
}

scenario managerCannotApproveLargeExpense {
    name = "Manager cannot approve an expense above the limit"

    relatesTo = [
        @behavior.expenseApprove,
        @policy.expenseApprove,
    ]

    given = [
        "The actor is a manager for Team A.",
        "The expense belongs to Team A.",
        "The expense amount is AUD 7,500.",
        "The expense status is submitted.",
    ]

    when = [
        "The actor attempts to approve the expense.",
    ]

    then = [
        "The approval is denied.",
        "The expense remains submitted.",
        "No expenseApproved event is emitted.",
    ]
}

requirement expenseAccessibility {
    title = "Expense screen accessibility"

    statement = """
    The expense details screen must be usable with a keyboard
    and must not communicate state using colour alone.
    """

    priority = must

    affects = [
        @screen.expenseDetails,
        @component.statusBadge,
    ]

    source = "Accessibility requirements"
}

constraint australianDataResidency {
    category = dataResidency

    statement = """
    Production application data must remain within Australia.
    """

    affects = [
        @deployment.production,
    ]
}

decision receiptThreshold {
    status = unresolved

    question = """
    Above what amount must an employee provide a receipt?
    """

    options = [
        "AUD 50",
        "AUD 75",
        "AUD 100",
        "A receipt is always required.",
    ]

    affects = [
        @entity.expense,
        @behavior.expenseSubmit,
        @screen.expenseDetails,
    ]

    blocks = [
        "implementationReady",
    ]
}

deployment production {
    name = "Production"
    environment = production
    region = "australia-southeast"

    requirements = [
        "Application data must remain within Australia.",
        "The service must run with at least two application instances.",
        "The database must be backed up daily.",
    ]
}
```

---

# 59. Recommended Tooling

A minimal Surface 0.1 toolchain SHOULD provide:

```text
surf parse
surf check
surf format
surf export
surf references
surf decisions
```

## 59.1 Parse

```text
surf parse surface.surf
```

Parses Surface source and reports syntax errors.

## 59.2 Check

```text
surf check surface.surf
```

Validates declarations, references, required attributes, and project structure.

## 59.3 Format

```text
surf format surface.surf
```

Applies canonical formatting.

## 59.4 Export

```text
surf export surface.surf --format json
```

Exports the parsed specification into a machine-readable representation.

## 59.5 References

```text
surf references @entity.expense
```

Lists declarations that reference the selected declaration.

## 59.6 Decisions

```text
surf decisions surface.surf
```

Lists unresolved and proposed decisions.

---

# 60. Surface Intermediate Representation

A Surface parser SHOULD be able to convert the source format into a structured intermediate representation.

Example:

```json
{
  "surfaceVersion": "0.1",
  "declarations": [
    {
      "type": "actor",
      "id": "employee",
      "attributes": {
        "name": "Employee",
        "kind": "human"
      }
    }
  ]
}
```

The exact Surface intermediate representation is not standardised in version 0.1.

Tools SHOULD preserve:

* declaration order;
* attribute order;
* comments where possible;
* source locations;
* unknown attributes;
* custom declarations.

---

# 61. Compatibility

A tool claiming Surface Language 0.1 compatibility MUST:

* parse valid Surface 0.1 syntax;
* reject invalid syntax;
* preserve unknown custom attributes;
* preserve custom declarations;
* resolve standard references;
* validate required project structure;
* report unsupported language versions;
* avoid assigning executable meaning not defined by this specification.

A tool MAY implement additional validation.

Additional validation MUST be clearly identified as tool-specific unless incorporated into a later Surface specification.

---

# 62. Versioning

Surface Language versions use:

```text
major.minor
```

Example:

```text
0.1
0.2
1.0
```

During the `0.x` series, incompatible language changes MAY occur.

A Surface file MUST declare the version it targets.

A tool MAY support multiple language versions.

A tool MUST NOT silently interpret a file using a different language version.

---

# 63. Security Considerations

A Surface specification may contain sensitive product or system information.

Surface files SHOULD NOT contain:

* passwords;
* private keys;
* access tokens;
* production credentials;
* personal user data;
* secret connection strings.

Surface files MAY describe:

* secret names;
* secret categories;
* security requirements;
* authorization policies;
* data classifications;
* trust boundaries.

Example:

```surf
constraint paymentCredentials {
    category = security

    statement = """
    Payment-provider credentials must be supplied through
    the deployment platform's secret-management system.
    """
}
```

---

# 64. Privacy Considerations

Surface specifications SHOULD identify privacy-sensitive information.

Example:

```surf
entity user {
    fields = [
        {
            id = "taxIdentifier"
            type = "string"
            required = false
            sensitive = true
        },
    ]
}
```

Version 0.1 does not define formal privacy enforcement.

Privacy obligations SHOULD also be recorded using requirements and constraints.

---

# 65. Future Language Features

Possible additions after version 0.1 include:

## 65.1 Version 0.2

* formal condition expressions;
* typed declaration schemas;
* formal field types;
* reusable declaration templates;
* namespaces;
* package imports;
* reference aliases;
* richer diagnostics.

## 65.2 Version 0.3

* executable policy evaluation;
* executable scenarios;
* workflow validation;
* invariant evaluation;
* semantic dependency graphs;
* semantic diffs;
* impact analysis.

## 65.3 Version 0.4

* generated tests;
* generated API contracts;
* generated database schemas;
* generated user-interface scaffolds;
* generated implementation plans.

## 65.4 Version 1.0

* stable normative semantics;
* migration rules;
* compatibility guarantees;
* generator conformance requirements;
* deterministic generation metadata;
* standard Surface intermediate representation.

---

# 66. Version 0.1 Success Criteria

Surface Language 0.1 is successful when:

1. A human can read a Surface file without specialist training.
2. An LLM can generate syntactically valid Surface declarations.
3. A parser can convert Surface files into a structured representation.
4. A validator can resolve references across a project.
5. Unresolved decisions remain visible.
6. Changes produce readable source-control diffs.
7. Multiple application types can use the same declaration model.
8. Coding agents can derive implementation tasks from a Surface specification.
9. Surface files remain independent of specific frameworks.
10. The language can evolve without discarding the original document model.

---

# 67. Summary

Surface Language 0.1 is a lightweight, structured application specification language.

Its fundamental unit is:

```surf
declarationType identifier {
    attribute = value
}
```

Its purpose is to provide a stable and reviewable source format between:

```text
human intent
LLM interpretation
software implementation
```

Version 0.1 deliberately combines formal document structure with controlled natural-language requirements.

It is designed to be written and read before it is designed to be executed.
