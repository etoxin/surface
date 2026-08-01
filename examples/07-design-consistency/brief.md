# Rung 7 Generation Brief

Build the application described by `surface.kdl` as one browser HTML page served by a
small Deno TypeScript server.

## Fixed Inputs

- Treat `surface.kdl` and the frozen Surface skill as authoritative.
- Use the vendored, rebranded GOV.UK Frontend 6.4.0 CSS under `vendor/`.
- Load the stylesheet from `/assets/govuk-frontend.min.css`.
- Do not add application custom CSS, `style` attributes, or another visual library. The
  supplied design-system build already uses the approved system font and Northbridge
  brand colour.
- Use the Generic header because this fictional council service is not on GOV.UK.
- Use only TypeScript and inline browser JavaScript; do not create `.js` source files.

## Runtime Adapter

Each build exports:

```ts
createApp(): (request: Request) => Promise<Response>
```

The handler serves:

- the application at `GET /`;
- the pinned stylesheet at `GET /assets/govuk-frontend.min.css`;
- `404` for everything else.

The three development servers use ports 8020, 8021, and 8022 respectively.

## Observable Contract

Use the exact copy, field IDs, validation order, review content, and confirmation
content from `surface.kdl`. The benchmark drives the application through initial, error,
review, and confirmation states at 390×844 and 1440×900 viewports.

Every state must use the same GOV.UK component classes. Source architecture and DOM
construction may differ, but the visible design must come only from the pinned design
system.
