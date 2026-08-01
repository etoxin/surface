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
Create surface.kdl for a small Twitter-style social application.

People can create an account, sign in, publish short text posts, follow other
people, and view a home timeline containing their posts and posts from people
they follow. They can like and reply to posts, open a person's profile, and see
useful empty, loading, validation, and error states.

Use Node.js for the server, React with TypeScript for the browser interface,
Vite for development and packaging, and SQLite for persistent data. Keep the
client synchronized with the server so new posts, replies, likes, and timeline
changes appear live without refreshing the page. Use an HTTP API and WebSockets
for the live-update transport.

Protect authenticated operations, store passwords securely, validate all
input, and prevent users from changing another person's content. Keep the
specification no larger than these requirements need, then check and format it
with surf.
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
