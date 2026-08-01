# Testing and Reporting

Test the Surface specification and its implementation separately.

## Specification Checks

```sh
mise run surf check path/to/surface.kdl
mise run surf format path/to/surface.kdl
mise run surf reference path/to/surface.kdl --list
```

## Implementation Checks

Derive acceptance tests from observable Surface intent:

- application routes or entry points;
- function inputs, outputs, errors, and ordering;
- interface copy, interaction, accessibility, and responsive behavior;
- screen navigation;
- declared stack and design-system constraints;
- negative cases for authorization, validation, isolation, and external failures.

Do not assert a particular source architecture unless the stack requires it. Independent
implementations should be allowed to differ internally.

## Repository Checks

```sh
mise run verify
```

## Useful Test Reports

When Surface is unclear or an implementation diverges, include:

- the smallest complete `.kdl` file that reproduces the issue;
- the Surface and KDL versions;
- the exact CLI or generation command;
- diagnostics and acceptance-test failures;
- the model and tool versions used for generation;
- assumptions or repairs made after the first generation;
- screenshots or response samples when behavior is visual or protocol-level.

If the current grammar is insufficient, report the missing capability in plain language.
Do not make the example pass by silently adding new Surface 0.1 syntax.
