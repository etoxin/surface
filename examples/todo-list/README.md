# Todo List

This browser specification demonstrates stacks, values, an enum, portable types, shared
and private collections, functions, interface state, validation, and ordered interaction
logic.

- [`surface.kdl`](./surface.kdl) is the source specification.

## Build the Application

```sh
mise run examples-prepare
cd examples/todo-list
```

Open your agent in this directory and invoke the build workflow:

```text
Codex:       $surf-build
Claude Code: /surf:build
```

The generated `build/` directory is ignored by Git.
