# Hello World

The smallest Surface specification demonstrates the file marker, format version,
application purpose, interface context, screen placement, and a checked interface
reference.

- [`surface.kdl`](./surface.kdl) is the source specification.

## Build the Application

```sh
mise run examples-prepare
cd examples/hello-world
```

Open your agent in this directory and invoke the build workflow:

```text
Codex:       $surf-build
Claude Code: /surf:build
```

The generated `build/` directory is ignored by Git.
