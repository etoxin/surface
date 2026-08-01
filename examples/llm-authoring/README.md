# Create a Specification with an LLM

This example starts without a `surface.kdl`. It shows how to give an LLM a product idea
and use the Surface skill to turn it into a checked specification. It assumes `surf` is
already installed for your user.

## Initialize the Workspace

From this directory, run:

```sh
surf init
```

Select Codex, Claude Code, or both. Then open the selected agent in this directory.

## Ask for a Specification

For Codex, start the prompt with `$surface`. For Claude Code, use `/surface`:

```text
Create surface.kdl for a browser-based temperature converter.

People enter a temperature, choose whether the input is Celsius or Fahrenheit,
and see the converted value in the other unit. Reject missing or non-numeric
input with a clear validation message.

Use HTML, CSS, and TypeScript. Use Pico CSS 2.1.1 as the design system. The app
does not need persistence or a server. Keep the specification as small as the
requirements allow, then check and format it with surf.
```

The LLM should create `surface.kdl`, use only frozen Surface 0.1 syntax, and correct any
diagnostics reported by the CLI.

## Check the Result

Run the checks yourself before building anything:

```sh
surf check surface.kdl
surf format surface.kdl
surf reference surface.kdl --list
```

Read the generated specification and adjust the product requirements with the LLM if it
made an assumption you do not want.

## Build the Application

Once the specification is correct, invoke the installed build workflow:

```text
Codex:       $surf-build or Surface Build
Claude Code: /surf:build
```

The generated application is written to the ignored `build/` directory.
