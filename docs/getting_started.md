# Getting Started

This guide checks a Surface specification and uses it to build a small application.
Surface does not yet publish packaged CLI releases, so build the executable locally.

## Install

Install [mise](https://mise.jdx.dev/), then clone the repository:

```sh
git clone https://github.com/etoxin/surface-lang.git
cd surface-lang
mise install
mise run verify
mise run build
```

`mise` installs Deno and exposes the repository tasks. Run `mise tasks` to list them.
The build produces a native executable for the current platform at `build/surf`.

### Install on macOS

Install the executable for your user without `sudo`:

```sh
install -d "$HOME/.local/bin"
install -m 755 build/surf "$HOME/.local/bin/surf"
```

Add `export PATH="$HOME/.local/bin:$PATH"` to `~/.zshrc`, then open a new terminal and
run `surf --help`. This installation path currently supports macOS only.

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

In a project directory, install the Surface build workflows:

```sh
surf init
```

Select Codex, Claude Code, or both. In a non-interactive script, pass `--codex`,
`--claude`, or both. The command also adds `/build/` to the project's `.gitignore`.

Check the specification:

```sh
surf check examples/hello-world/surface.kdl
```

Format a valid file in place:

```sh
surf format examples/hello-world/surface.kdl
```

List the references that context and logic can use:

```sh
surf reference examples/todo-list/surface.kdl --list
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

Surface does not compile to source code. Follow
[Generating applications](./generating_applications.md) to prepare an example workspace
and give the checked specification to an LLM. Generated applications belong in the
ignored `build/` directory. Review and test the result as ordinary application code.
