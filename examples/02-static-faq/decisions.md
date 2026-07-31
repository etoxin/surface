# Static FAQ Decisions

## Composition

The FAQ does not add `question` or `answer` nodes. Each FAQ entry is a
generic `section`: its name is the question and its ordered `text` is the
answer. This keeps Surface reusable for other kinds of grouped text.

Long answers use KDL multiline strings. Blank lines inside the string are part
of the text value.

## Implementation

The example page renders the screen as a page, each section name as a heading,
and each text value as body copy. The `Surface FAQ` page heading and document
title are implementation chrome; they do not add new Surface syntax.

## Acceptance Scenario

Given the Static FAQ page is opened, the three questions appear in the same
order as their sections in `surface.kdl`. Each answer appears below its
question, including the blank lines in multiline text.
