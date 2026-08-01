# Rung 7 Decisions

## Application

The benchmark uses a fictional local-government street-reporting service. This supports
a realistic form journey without presenting the example as an official GOV.UK service.
The Generic header is used instead of the GOV.UK crown and logotype.

## Design Constraint

`technology "designSystem" "govUkFrontend" version="6.4.0"` is declared in the
application's web stack. The role is allowed by Surface 0.1's open technology
vocabulary. Interface context selects official components and forbids application custom
CSS; this does not add structured UI grammar.

The compiled GOV.UK Frontend stylesheet is vendored so rendering does not depend on an
external CDN. Its package version is pinned to 6.4.0. Following the design system's
non-GOV.UK branding guidance, its Sass configuration replaces GDS Transport with the
recommended system-font stack and replaces the GOV.UK brand colour with Northbridge
teal. This is configuration of the borrowed system, not application-level custom CSS.

## Comparison

The behavioral test checks copy, component classes, field errors, focus movement,
preserved values, review data, navigation, and confirmation. The visual runner captures
four states at mobile and desktop sizes and compares corresponding screenshots pixel by
pixel.

Exact screenshot identity is recorded, but the pass threshold allows a small mismatch to
accommodate renderer-level differences. All builds are rendered by the same pinned
Playwright Chromium release during one benchmark run, making larger differences
attributable to their HTML and state rendering rather than different browser engines.
The original checked-in artifacts were captured with WebKitGTK MiniBrowser 2.52.3; every
new report records the Chromium version it used. The runner resets scroll position
before capture so navigation history does not create a false visual mismatch.

## Limitation

The original implementations are separate architectures produced during one development
run. The additional `independent-builds` were produced by three isolated agents that
could read only the frozen generation inputs and their own output. This provides the
first independent-generation evidence, but it remains one three-agent sample using one
model family. The Markdown-only control described in the roadmap is still needed.
