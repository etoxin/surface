---
name: surf-build
description: Build and verify an application from the surface.kdl specification in the current example directory. Use when asked to implement, regenerate, or complete a Surface example in its ignored build/ directory.
---

# Build a Surface Application

1. Read `surface.kdl` completely. Treat it as authoritative and do not modify it.
2. Read the available Surface language skill at
   `.agents/skills/surface/SKILL.md` or `.claude/skills/surface/SKILL.md`.
3. Validate the specification with the repository Surface CLI when it is available.
   Stop and report diagnostics if it is invalid.
4. Inspect the declared stack, context, checked references, and ordered logic before
   choosing the implementation structure.
5. Implement the complete application inside `build/`. Do not write generated source,
   dependencies, or artifacts outside `build/`.
6. Follow pinned technologies and design systems. Implement every observable behavior,
   error case, security boundary, and interface requirement expressed by the
   specification.
7. Add and run appropriate tests inside `build/`. Build and launch the application when
   practical, then verify its observable behavior rather than relying only on static
   checks.
8. Add concise instructions inside `build/` explaining how to install dependencies,
   test, and run the generated application.
9. If the specification is insufficient, stop and report the smallest concrete blocker
   instead of changing `surface.kdl`, inventing Surface syntax, or silently guessing.

Finish by reporting what was built, the verification commands and results, how to run
the app, and any remaining assumptions.
