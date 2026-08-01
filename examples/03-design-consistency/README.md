# Design Consistency

This example tests whether independent implementations of one Surface specification
converge on the same behavior and visual design when the stack pins GOV.UK Frontend
6.4.0.

- [`surface.kdl`](./surface.kdl) is the frozen source specification.
- [`brief.md`](./brief.md) is the frozen implementation brief.
- [`benchmark.md`](./benchmark.md) explains the method and findings.
- [`artifacts/`](./artifacts/) contains the coordinated-build report and screenshots.
- [`independent-artifacts/`](./independent-artifacts/) contains the isolated-build
  report and screenshots.

```sh
mise run design-consistency
mise run design-independent
mise run design-independent-visual
```

The visual task installs a pinned Playwright Chromium browser on first use.
