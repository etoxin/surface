# Static FAQ Decisions

## Interface

The FAQ is described as one interface with prompt context. Surface does not add
`question`, `answer`, `section`, or `text` nodes. The context specifies the
exact ordered content, including the blank lines in the multiline answer, while
the implementer chooses accessible HTML and layout.

## Acceptance Scenario

Given the Static FAQ page is opened, the three specified questions appear in
order and each answer appears with its question. The multiline answer preserves
its paragraph break.
