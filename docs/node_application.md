# Describing the Application

Every Surface file describes one application:

```kdl
application "helloWorld" {
    purpose "Display a greeting."
}
```

## Application ID

`"helloWorld"` is the application's ID. It gives tools a stable way to refer
to the application; it is not text shown to a user.

Start the ID with a lowercase letter. For multiple words, use lower camel case,
such as `contactViewer`. An ID cannot contain spaces, hyphens, or underscores.

The `application` node does not have properties.

## Purpose

Every application has exactly one `purpose`:

```kdl
purpose "Display a greeting."
```

Write a short sentence explaining what the application is for. The purpose is
not a title or text displayed on a screen.

If the purpose needs extra guidance, attach
[context](./node_context.md) directly to it:

```kdl
purpose "Display a greeting." {
    context "Do not add navigation or secondary actions."
}
```

An application can contain:

- exactly one `purpose`;
- any number of prompt-only `context` notes.

It cannot contain screens. Screens are separate top-level declarations,
usually written after the application:

```kdl
application "helloWorld" {
    purpose "Display a greeting."
}

interface "helloWorld" {
    context "Render a user interface with the exact text: Hello, world!"
}

screen "home" {
    use (interface)"helloWorld"
}
```

The referenced interface is a separate top-level declaration. Continue with
[describing an interface](./node_interface.md).
