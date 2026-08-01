# Choosing the Technology Stack

Add a `stack` inside the application when its implementation choices matter:

```kdl
application "todoList" {
    purpose "Manage personal tasks."

    stack "web" {
        target "browser"
        technology "markup" "html"
        technology "styling" "css"
        technology "language" "javascript"
        technology "storage" "browserMemory"
        technology "packaging" "singleFile"
    }
}
```

The stack ID, such as `web`, distinguishes one part of the application from
another. IDs use lower camel case and must be unique within the application.
An application can contain several stacks, such as `frontend`, `api`, and
`data`.

## Target

Every stack has exactly one target. It says where that part of the application
runs or is delivered:

```kdl
target "browser"
```

Targets are open strings. Surface does not restrict them to a fixed catalogue,
so targets such as `server`, `ios`, `android`, `desktop`, or `cloud` are also
valid.

## Technologies

Every stack has one or more technologies. The first string is the technology's
role and the second is its name:

```kdl
technology "language" "typescript"
technology "framework" "react" version="19"
technology "database" "postgresql" version="18"
```

Roles use lower camel case, but remain open-ended. Use the role that best
explains why the technology is present, such as `language`, `runtime`,
`framework`, `database`, `hosting`, or `packageManager`. Several technologies
can share a role when the stack genuinely uses all of them. The same role and
name pair cannot be repeated in one stack.

`version` is optional and must be a quoted string. Include it when the version
is an intentional implementation constraint; omit it when a compatible or
current version is acceptable.

Design belongs in the stack when a named design system is an implementation
constraint:

```kdl
technology "designSystem" "govUkFrontend" version="6.4.0" {
    context "Use the official components without custom CSS."
}
```

`designSystem` is an ordinary open technology role. It makes the choice visible in the
semantic IR; context can then explain how strictly to apply it. Do not create a separate
`design`, `theme`, or component declaration.

## Extra Guidance

Attach [context](./node_context.md) to a stack, target, or technology when the
structured values do not say enough:

```kdl
technology "database" "postgresql" version="18" {
    context "Use managed hosting with automated backups."
}
```

Context guides the implementation but is not included in the semantic IR.
Stack IDs, targets, roles, names, versions, and their order are included.
