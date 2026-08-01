# Multi-tenant Project Tracker

This platform-scale example covers tenant isolation, tenant-specific roles, project and
work-item operations, composite resource identity, optimistic updates, authorization,
and non-enumerating failures. Its browser stack pins Pico CSS 2.1.1, served locally with
the app.

- [`surface.kdl`](./surface.kdl) is the source specification.
- [`app/`](./app/) contains the Deno reference implementation and tests.
- [`decisions.md`](./decisions.md) documents identities, seed data, and trust boundaries.

```sh
mise run multi-tenant-project-tracker
```

Open <http://localhost:8007/> and switch between the development identities to exercise
the role and isolation rules.
