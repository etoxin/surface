# Independent Builds

These three applications were generated in separate agent sessions from the same frozen
inputs:

- `../surface.kdl`;
- `../brief.md`;
- `../../../skills/surface/SKILL.md`;
- the vendored GOV.UK Frontend stylesheet, used only as the required runtime asset.

Each agent wrote to one numbered directory and was explicitly prohibited from reading
the coordinated builds, benchmark implementations, captured artifacts, decisions, or the
other independent outputs. The agents did not share implementation guidance or source
code.

The independent behavioral and visual benchmarks are integration steps performed after
all three generations complete. They are not generation inputs.
