# Multi-tenant Project Tracker

This platform-scale specification covers tenant isolation, tenant-specific roles,
project and work-item operations, composite resource identity, optimistic updates,
authorization, and non-enumerating failures. Its browser stack pins Pico CSS 2.1.1.

- [`surface.kdl`](./surface.kdl) is the source specification.

## Build the Application

Ensure you have built Surface and installed `surf` for your user, then run:

```sh
surf init
```

Select your LLM tool. Open your agent in this directory and invoke the build workflow:

```text
Codex:       $surf-build or Surface Build
Claude Code: /surf:build
```

The generated `build/` directory is ignored by Git. Review tenant isolation and
authorization carefully before treating a generated implementation as production code.
