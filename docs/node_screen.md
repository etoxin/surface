# Adding Screens and Text

A screen describes one view in the application. Every Surface file needs at
least one.

```kdl
screen "home" route="/" {
    section "Home" {
        title "My app"
        text "Hello, world!"
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
        text "Hello, world!"
    }
}
```

Leave it out for a screen that is not addressable:

```kdl
screen "home" {
    section "Home" {
        text "Hello, world!"
    }
}
```

Use a typed `use` reference when a screen displays query data:

```kdl
screen "contact" route="/contacts" {
    use (query)"contactById"
    // Sections and states go here.
}
```

The `(query)` annotation makes `"contactById"` a checked reference to a query
declared in the same file. A screen can use at most one query in Rung 3. For
web screens, URL query parameters with the same names as fields on the query's
input entity provide their values.

A screen can contain:

- one or more `section` nodes, or only `context` notes for a non-visual screen;
- zero or one `use (query)"<query>"` reference;
- `empty` and `notFound` states when the screen has a query;
- any number of prompt-only [`context`](./node_context.md) notes.

Sections stay in the order in which you write them.

Use a context-only screen when a route needs implementation guidance but has
no interface of its own:

```kdl
screen "home" route="/" {
    context (screen)"contact" "Redirect to this screen."
}
```

Because `context` is unstructured prompt guidance, this does not introduce a
separate redirect or logic feature. The annotated string is a checked reference
to the target screen. A context-only screen cannot use a query or define states.
A completely empty screen is invalid.

## Section

A section groups related content on a screen:

```kdl
section "Welcome" {
    title "My app"
    text "Hello, world!"
    text "Welcome to Surface."
}
```

`"Welcome"` is the section's name. It is ordinary text, so it does not follow
the lower-camel-case ID rule.

A section can contain:

- one optional `title`;
- any number of `text` nodes;
- field references when its screen has a query;
- any number of prompt-only [`context`](./node_context.md) notes.

Every section needs at least one text or field node. Sections, text, and field
references stay in the order in which you write them. Use text or field
references in a section, but do not mix the two content forms in one section.

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

## Text

Each `text` node adds one ordered block of content:

```kdl
text "Hello, world!"
text "Welcome to Surface."
```

A text node accepts one quoted string and no properties. It can contain
prompt-only context:

```kdl
text "Hello, world!" {
    context "Keep this text visually prominent."
}
```

For longer content, use KDL's triple-quoted multiline text:

```kdl
text """
    Surface is a small format for describing an application.

    It does not choose an implementation framework.
    """
```

Start the content on the line after the opening `"""`. Align the content and
the closing `"""` as shown. Blank lines are kept as part of the text.

## Showing Query Fields

Inside a normal section of a queried screen, `field` refers to data returned
by that query:

```kdl
section "Contact" {
    title "Contact"
    field "name"
    field "email"
    field "active"
}
```

Surface follows the screen's query to its returned entity, then resolves each
field name on that entity. The fields are displayed in source order. A field
reference has no properties, but it can contain prompt-only context.

A section cannot refer to fields without a query, and it cannot refer to a
field that the returned entity does not declare.

## Empty and Not-Found States

Every queried screen has exactly one `empty` state and one `notFound` state:

```kdl
state "empty" {
    section "No contact selected" {
        title "Select a contact"
        text "Choose a contact identifier to view its details."
    }
}

state "notFound" {
    section "Contact not found" {
        title "Contact not found"
        text "No contact exists for the selected identifier."
    }
}
```

The `empty` state appears when a required field on the query's input entity is
absent. The `notFound` state appears when the query finds no entity.

States contain one or more ordinary sections and can contain prompt-only
context. Their sections use static titles and text; they cannot refer to
entity fields because no entity result is available.

## Building an FAQ

Generic sections already provide everything a static FAQ needs. Use each
section name as a question and its text as the answer:

```kdl
screen "faq" route="/faq" {
    section "What is Surface?" {
        text """
            Surface is a format for describing applications.

            It is designed to be read by people and LLMs.
            """
    }

    section "Does every screen need a route?" {
        text "No. Leave out route when the screen is not addressable."
    }
}
```

Do not introduce `question` or `answer` nodes. Those concepts are specific
to an FAQ, while sections and text remain useful across many kinds of
applications.

## Several Screens

Add another top-level `screen` node for another view:

```kdl
screen "home" route="/" {
    section "Home" {
        text "Hello, world!"
    }
}

screen "about" route="/about" {
    section "About" {
        text "This application demonstrates Surface."
    }
}
```
