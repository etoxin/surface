# Hello World

The smallest Surface specification demonstrates the file marker, format version,
application purpose, interface context, screen placement, and a checked interface
reference.

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

The generated `build/` directory is ignored by Git.
