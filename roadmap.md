# Surface Application Roadmap

## Direction

Surface grows through applications, not a catalogue of proposed declarations. Each
application asks whether the frozen Surface 0.1 vocabulary is sufficient to produce a
working implementation.

For every application:

1. describe the observable result;
2. try the existing grammar first;
3. implement it from the Surface file;
4. test observable behaviour and specification-to-IR stability;
5. record assumptions and ambiguities;
6. treat a genuine language blocker as evidence for a future version, not as permission
   to extend 0.1.

## Surface 0.1 Freeze

The [Surface 0.1 grammar](./docs/grammar.md) is frozen. Surface 0.1 may receive bug
fixes, better diagnostics, formatting improvements, documentation, and tooling, but its
valid syntax will not grow.

An application that cannot be expressed faithfully should stop and report the smallest
missing capability. Any syntax experiment belongs to a prospective Surface 0.2 and must
not make a Surface 0.1 file invalid.

## Completion Gate

A completed application has:

- a valid, canonically formatted `surface.kdl`;
- a reviewed `expected-ir.json` that exactly matches CLI export;
- resolved references and useful invalid fixtures;
- a runnable implementation produced from the specification;
- automated acceptance tests for observable behaviour;
- implementation assumptions in `decisions.md`;
- updated human documentation when it clarifies existing 0.1 syntax;
- an updated Surface skill and fresh create, modify, and diagnose evaluations;
- a passing repository verification task.

Candidate and benchmark implementations may be committed before this full gate is
satisfied, but they must be labelled accordingly.

## Application Ramp

### 1. Hello World Page

**Status:** Complete

Build one page displaying a greeting. Establish the file marker, application purpose,
interface intent, screen placement, checked references, formatting, IR export, and the
smallest possible implementation.

Delivered in [examples/01-hello-world](./examples/01-hello-world/).

### 2. Static FAQ

**Status:** Complete

Build an ordered, content-heavy FAQ. Test multiline prompt content, comments,
formatting, accessibility intent, and a URL described through screen logic without
FAQ-specific syntax.

Delivered in [examples/02-static-faq](./examples/02-static-faq/).

### 3. Contact Viewer

**Status:** Complete

Build a read-only contact lookup. Test typed collections, optional fields, private
function input collections, checked input/output references, missing results, and
ordered logic across functions, interfaces, and screens.

Delivered in [examples/03-contact-viewer](./examples/03-contact-viewer/).

### 4. Click Counter

**Status:** Complete

Build a local counter with increment and reset. Confirm that interface logic can
describe local interaction and observable state without a dedicated state, event, actor,
or behaviour model.

Delivered in [examples/04-click-counter](./examples/04-click-counter/).

### 5. Todo List

**Status:** Complete

Build a task list with open, completed, and archived items. Exercise application stacks,
values, enums, portable types, shared collections, callable functions, mutable
implementation state, validation, and grouped UI behaviour.

Delivered in [examples/05-todo-list](./examples/05-todo-list/).

### 6. Signup Determinism Benchmark

**Status:** Baseline complete

Build the same accessible signup application three times from one frozen Surface file
and one identical generation brief. Compare observable behaviour, acceptance-test
results, structure, and implementation choices.

The application validates email, password, confirmation, and terms acceptance; reports
field-level errors; prevents duplicate accounts; and exposes loading, error, and success
states. The experiment asks whether Surface produces more consistent behaviour even when
source code and visual design vary.

Delivered in [examples/06-signup-determinism](./examples/06-signup-determinism/).

### 7. Private Notes

**Status:** Planned

Build private notes with ordinary users and administrators. Test whether collections,
enums, functions, and normative function logic can state resource ownership, allow and
deny behaviour, non-leaking failures, and negative acceptance cases clearly enough
without a dedicated policy model.

### 8. URL Shortener API

**Status:** Candidate implemented

Build an HTTP API that creates unique short links and resolves public or protected
links. Test methods, paths, path parameters, status mappings, authentication,
uniqueness, URL values, and persistence using functions and ordered logic.

Candidate in [examples/08-url-shortener-api](./examples/08-url-shortener-api/).

### 9. Reminder Service

**Status:** Planned

Build scheduled reminders delivered through an external provider. Test whether functions
and logic can state schedules, provider calls, required secret names, timeouts, retry
limits, idempotency, and transient versus permanent failure without misrepresenting
background execution.

### 10. Expense Approval

**Status:** Planned

Build employee expense submission, manager limits, and finance review. Test money
representation, multi-step approval, authorization, unresolved product choices, and
success and failure cases. Record whether implementation-blocking decisions need
representation beyond context.

### 11. File Converter

**Status:** Candidate implemented

Build a local binary file converter with custom deterministic code and a download
result. Test byte contracts, implementation dependencies, deadlines, failure behaviour,
and whether a function is sufficient for a custom capability.

Candidate in [examples/11-file-converter](./examples/11-file-converter/).

### 12. Secure Document Vault

**Status:** Planned

Build encrypted storage for privacy-sensitive documents. Test whether the frozen
language can convey field sensitivity, encryption, retention, trust boundaries, secret
management, and verification requirements without losing normative meaning.

### 13. Production Web Service

**Status:** Planned

Deploy an earlier application with environments, regions, data residency, availability,
backup, recovery, scaling, metrics, logs, traces, and alerting. Test how much
operational intent belongs in stack choices and how much remains outside Surface 0.1.

### 14. Modular Help Desk

**Status:** Planned; expected 0.1 boundary

Build a help desk large enough to pressure a single file. Measure authoring, navigation,
reference resolution, and duplicate-name problems. Record evidence for multi-file
projects without adding imports to Surface 0.1.

### 15. Online Checkout

**Status:** Candidate implemented

Build baskets, stock reservation, payment, receipts, fulfillment, retries, idempotency,
external failures, compensation, authorization, API operations, and UI flows. Test
whether related collections, functions, stacks, context, and ordered logic remain
understandable at capstone size.

Candidate in [examples/15-online-checkout](./examples/15-online-checkout/).

### 16. Multi-Tenant Project Tracker

**Status:** Candidate implemented

Build tenant-owned projects and work items with different roles per tenant. Test
isolation, cross-cutting authorization, terminology consistency, large reference graphs,
same-tenant relationships, optimistic updates, and semantic impact analysis.

Candidate in
[examples/16-multi-tenant-project-tracker](./examples/16-multi-tenant-project-tracker/).

### 17. Collaborative Board

**Status:** Planned; expected 0.1 boundary

Build live collaboration with intermittent offline use. Test WebSocket lifecycles,
concurrent edits, conflict resolution, event ordering, synchronization, and eventual
consistency. Do not force precise concurrency guarantees into vague prose merely to
claim success.

### 18. Bank Transfer System

**Status:** Planned; expected 0.1 boundary

Build account transfers with immutable audit history. Test transaction boundaries,
consistency, idempotency, recovery, compensation, invariants, and executable acceptance
behaviour. Treat any need for formal transaction or condition semantics as evidence for
a future version.

### 19. Production Reconstruction Benchmark

**Status:** Planned

Reconstruct a production-style application using only its Surface project and pinned
toolchain inputs. Compare independent implementations for API, data, UI, tests,
infrastructure, semantic changes, reproducibility, and conformance. This is the
long-term test of whether Surface is more useful than a prose brief.

## What the Roadmap Measures

The roadmap is successful if it answers these questions:

- Can a human read and change the specification safely?
- Can an LLM implement it without hidden conversation history?
- Do independent implementations agree on observable behaviour?
- Do checked references and IR provide value beyond Markdown?
- Can later changes preserve unrelated intent?
- Where does controlled natural language become genuinely ambiguous?

The goal is evidence, not declaration coverage.
