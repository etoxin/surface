# Static FAQ Decisions

## Interface

The FAQ is described as one interface with prompt context. Surface does not add
`question`, `answer`, `section`, or `text` nodes. The context specifies the
exact ordered content, including the blank lines in the multiline answer, while
the implementer uses a responsive editorial layout with numbered cards,
semantic headings, visible answers, strong contrast, and a skip link.

The `faq` screen uses the interface and assigns `/faq` as its URL path through
one inline logic instruction. It does not use the legacy `route` property.
The Deno TypeScript server serves the page at that path and returns 404 for
unknown paths.

## Acceptance Scenario

Given `/faq` is opened, the three specified questions appear in order and each
answer appears with its question. The multiline answer preserves its paragraph
break.
