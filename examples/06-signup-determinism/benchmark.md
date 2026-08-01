# Signup Determinism Baseline

## Result

Three implementations were built from the same frozen Surface file and generation brief.

| Measurement                                   | Result |
| --------------------------------------------- | ------ |
| Builds passing their complete contract        | 3 of 3 |
| Shared acceptance assertions                  | 100%   |
| Cross-build observable result sequences equal | Yes    |
| Builds selecting Pico CSS 2                   | 3 of 3 |
| Unique TypeScript source hashes               | 3 of 3 |
| Unique HTML source hashes                     | 3 of 3 |

The common sequence covers ordered field validation, exact error messages, email
normalization, account creation, generated UUID shape, duplicate-email conflict, root UI
delivery, and unknown routes. Generated UUID values are replaced with `<uuid>` before
cross-build comparison.

## Variation

- Build 01 uses closures, a map, and a compact card layout.
- Build 02 uses an application class, private methods, and a split-panel layout.
- Build 03 uses an ordered validation-rule pipeline and a minimal editorial layout.

All three differ byte-for-byte in both TypeScript and HTML. The benchmark therefore
shows behavioral convergence, not source-code determinism.

## Run It

```sh
mise run signup-determinism
```

Run an individual build at `http://localhost:8010`, `:8011`, or `:8012`:

```sh
deno run --allow-read --allow-net examples/06-signup-determinism/builds/01-functional/server.ts
deno run --allow-read --allow-net examples/06-signup-determinism/builds/02-object/server.ts
deno run --allow-read --allow-net examples/06-signup-determinism/builds/03-pipeline/server.ts
```

## Interpretation

This baseline proves the comparison harness works and that different implementations can
agree on the specification's observable behavior. It does not yet prove model-to-model
determinism because the checked-in builds were created during one development run.

The next measurement should delete each build in turn and regenerate it with a fresh
agent that can read only `surface.kdl`, `brief.md`, the frozen Surface skill, and its
empty destination. Record model and tool versions, tokens, elapsed time, test failures
before repair, final acceptance rate, and source hashes. A Markdown-only control should
use the same product content without Surface structure.
