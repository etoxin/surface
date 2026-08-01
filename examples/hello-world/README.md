# Hello World

The smallest Surface application demonstrates the file marker, format version,
application purpose, interface context, screen placement, and a checked interface
reference.

- [`surface.kdl`](./surface.kdl) is the source specification.
- [`expected-ir.json`](./expected-ir.json) is its reviewed semantic export.
- [`app/index.html`](./app/index.html) is one intentionally small implementation.
- [`invalid/`](./invalid/) contains diagnostic examples.

```sh
mise run surf check examples/hello-world/surface.kdl
mise run surf export examples/hello-world/surface.kdl --format json
```

Open `app/index.html` directly in a browser to view the implementation.
