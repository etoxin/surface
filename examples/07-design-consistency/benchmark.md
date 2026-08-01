# HTML Design Consistency Benchmark

## Result

Three implementations were built from the same frozen Surface file, generation brief,
and locally vendored GOV.UK Frontend 6.4.0 assets.

| Measurement                        | Result   |
| ---------------------------------- | -------- |
| Builds passing the server contract | 3 of 3   |
| Browser states completed per build | 4 of 4   |
| Mobile and desktop screenshots     | 24       |
| Pairwise screenshot comparisons    | 16       |
| Pixel-identical comparisons        | 16 of 16 |
| GOV.UK component signatures equal  | 16 of 16 |
| Minimum visual similarity          | 100%     |
| Unique HTML source hashes          | 3 of 3   |
| Unique TypeScript server hashes    | 3 of 3   |

The screenshots cover initial form, validation errors, review, and confirmation at
390×844 and 1440×900. Every comparison uses Build 01 as its baseline and compares the
same state from Builds 02 and 03.

## What Varied

- Build 01 generates each state with render functions.
- Build 02 clones HTML templates and modifies their DOM.
- Build 03 wraps rendering and event delegation in an application controller.

Their source code differs, but the browser-visible DOM uses the same design-system
components and exact content. After normalizing the scroll position before each capture,
all corresponding images were pixel-identical in WebKitGTK MiniBrowser 2.52.3. Those
checked-in artifacts record the original benchmark run; a new run records its pinned
Chromium version in the report.

## Run It

Run the portable server and asset contract:

```sh
mise run design-consistency
```

The visual benchmark uses a pinned Playwright Chromium release on macOS and Linux:

```sh
mise run design-visual
```

The task installs Chromium on first use, then rewrites `artifacts/visual-report.json`
and the screenshots under `artifacts/screenshots/`. Run the applications individually at
ports 8020, 8021, and 8022 with `mise run design-build-1`, `design-build-2`, or
`design-build-3`.

## Interpretation

This result shows that Surface can anchor highly consistent visual output when the stack
pins a prescriptive design system and the interface context fixes its allowed
components, content, and customization boundary. The design system—not Surface
alone—provides most of the pixel-level determinism.

It does not yet establish independent model-to-model consistency. These builds were
created in one development run, and they intentionally share exact observable
requirements. The stronger follow-up remains isolated fresh-agent generation plus the
Markdown-only control described in the roadmap.
