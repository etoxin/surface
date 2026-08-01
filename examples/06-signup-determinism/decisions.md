# Signup Determinism Decisions

## What Is Compared

All three builds consume the same `surface.kdl` and `brief.md`. Each exposes the same
small adapter so one black-box suite can exercise it. The benchmark checks HTTP
contracts, validation messages and order, normalization, duplicate handling, UI content,
and state isolation.

Source layout, names below the adapter, markup structure, and visual composition may
differ. That variation is useful: Surface is expected to make observable behavior
converge, not produce byte-identical source code.

The checked-in builds establish a repeatable baseline for the harness. A real model
comparison should regenerate each build in a fresh context without access to the others
and record the model, tool version, prompt, token use, elapsed time, and acceptance
result.

## HTTP Adapter

`POST /register` is the concrete transport chosen for the benchmark. Surface does not
define HTTP-to-function mapping. Malformed JSON or values with the wrong primitive types
return `400` with `{ "error": "invalidRequest" }`; this adapter behavior is outside the
application comparison.

Each build owns isolated in-memory state. Tests create the same normalized email twice
to exercise conflict behavior without seed data. UUIDs and creation times may differ and
are normalized before cross-build comparison.

## User Interface

All builds load Pico CSS 2 from jsDelivr because the stack explicitly selects that UI
library. Their local CSS and layout may differ. Browser scripts normalize email before
submission, preserve terms acceptance after failure, clear password fields, render all
returned errors, focus the first invalid field, and replace the form after success.
