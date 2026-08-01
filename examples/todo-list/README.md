# Todo List

This self-contained browser application demonstrates stacks, values, an enum, portable
types, shared and private collections, functions, interface state, validation, and
ordered interaction logic.

- [`surface.kdl`](./surface.kdl) is the source specification.
- [`app/index.html`](./app/index.html) is one implementation with no build step.
- [`decisions.md`](./decisions.md) records implementation choices.
- [`invalid/`](./invalid/) contains focused diagnostic examples.

```sh
mise run surf check examples/todo-list/surface.kdl
mise run todo-list
```

Open <http://localhost:8003/> after starting the task.
