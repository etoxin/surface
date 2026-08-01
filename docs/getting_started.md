# Getting Started

This guide checks a Surface specification and uses it to build a small application.
Surface is currently tested from this repository; there is not yet a packaged CLI
release.

## Install

Install [mise](https://mise.jdx.dev/), then clone the repository:

```sh
git clone https://github.com/etoxin/surface-lang.git
cd surface-lang
mise install
mise run verify
```

`mise` installs Deno and exposes the repository tasks. Run `mise tasks` to list them.

## Read the Smallest Example

Open [`examples/hello-world/surface.kdl`](../examples/hello-world/surface.kdl):

```kdl
/- kdl-version 2

surface "0.1"

application "helloWorld" {
    purpose "Display a greeting."
}

interface "helloWorld" {
    context "Render a user interface with the title My app and the exact text: Hello, world!"
}

screen "home" {
    use (interface)"helloWorld"
}
```

The application states why it exists. The interface describes what a person should see
without prescribing HTML or controls. The screen places that interface in the app.

## Use the CLI

Check the specification:

```sh
mise run surf check examples/hello-world/surface.kdl
```

Format a valid file in place:

```sh
mise run surf format examples/hello-world/surface.kdl
```

List the references that context and logic can use:

```sh
mise run surf reference examples/todo-list/surface.kdl --list
```

## Write Your Own Specification

Copy Hello World to a new `.kdl` file and change one concern at a time:

1. Give the application a lower-camel-case ID and one clear purpose.
2. Add a stack only when implementation choices matter.
3. Add values and collections for information that needs a reusable name or checked
   shape.
4. Add functions for separately callable capabilities.
5. Describe presentation with interface context and ordered interactions with logic.
6. Add at least one screen.
7. Run `check`, then `format`, after each meaningful change.

The [complete grammar](./grammar.md) is authoritative. Unknown nodes and properties are
errors even when they are valid KDL.

## Build the Application

Surface does not compile to source code. Follow [Generating applications](./generating_applications.md)
to give the checked specification and the included Surface skill to an LLM. Review and
test the result as ordinary application code.
