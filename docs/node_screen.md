# Adding Screens and Content

A screen describes one view in the application. Every Surface file needs at
least one.

```kdl
screen "home" route="/" {
    section "Home" {
        title "My app"
        paragraph "Hello, world!"
    }
}
```

## Screen

`"home"` is the screen ID. Like an application ID, it starts with a lowercase
letter and should use lower camel case. Each screen needs a different ID.

`route` is optional. Use it when the screen has a URL or similar address:

```kdl
screen "home" route="/" {
    section "Home" {
        paragraph "Hello, world!"
    }
}
```

Leave it out for a screen that is not addressable:

```kdl
screen "home" {
    section "Home" {
        paragraph "Hello, world!"
    }
}
```

A screen can contain:

- one or more `section` nodes;
- any number of prompt-only [`context`](./node_context.md) notes.

Sections stay in the order in which you write them.

## Section

A section groups related content on a screen:

```kdl
section "Welcome" {
    title "My app"
    paragraph "Hello, world!"
    paragraph "Welcome to Surface."
}
```

`"Welcome"` is the section's name. It is ordinary text, so it does not follow
the lower-camel-case ID rule.

A section can contain:

- one optional `title`;
- one or more `paragraph` nodes;
- any number of prompt-only [`context`](./node_context.md) notes.

Every section needs at least one paragraph, even when it has a title.
Paragraphs stay in the order in which you write them.

## Title

A `title` is the optional heading displayed for a section:

```kdl
title "My app"
```

A section can have no title or one title, but not several. A title accepts one
quoted piece of text and no properties. It can contain prompt-only context:

```kdl
title "My app" {
    context "Render this as the primary heading."
}
```

## Paragraph

Each `paragraph` adds one block of text:

```kdl
paragraph "Hello, world!"
paragraph "Welcome to Surface."
```

A paragraph accepts one quoted piece of text and no properties. It can contain
prompt-only context:

```kdl
paragraph "Hello, world!" {
    context "Keep this text visually prominent."
}
```

## Several Screens

Add another top-level `screen` node for another view:

```kdl
screen "home" route="/" {
    section "Home" {
        paragraph "Hello, world!"
    }
}

screen "about" route="/about" {
    section "About" {
        paragraph "This application demonstrates Surface."
    }
}
```
