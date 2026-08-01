# Starting a Surface File

Every Surface file begins the same way:

```kdl
/- kdl-version 2

surface "0.1"
```

The first line tells tools that the file uses KDL 2. It must be the very first
line.

The `surface` line tells tools that this is a Surface document. `"0.1"` is
the Surface format version currently supported, so copy it exactly. A file has
one `surface` node, before the other declarations.

Usually the node does not need a child block. If guidance applies to the whole
file, add [context](./node_context.md):

```kdl
surface "0.1" {
    context "Use accessible defaults throughout the application."
}
```

Do not add properties or other children to `surface`.

Next, [describe the application](./node_application.md).
