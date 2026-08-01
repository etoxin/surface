# Online Checkout

This platform-scale example covers baskets, inventory reservations, payments,
idempotency, receipts, asynchronous fulfillment, compensation, authorization, and
failure handling. Its browser stack pins Pico CSS 2.1.1, served locally with the app.

- [`surface.kdl`](./surface.kdl) is the source specification.
- [`expected-ir.json`](./expected-ir.json) is its reviewed semantic export.
- [`app/`](./app/) contains the Deno reference implementation and tests.
- [`decisions.md`](./decisions.md) documents its local adapters and safety boundaries.

```sh
INVENTORY_API_TOKEN=development \
PAYMENT_API_TOKEN=development \
mise run online-checkout
```

Open <http://localhost:8006/checkout>. This is a deterministic reference implementation,
not a production payment system.
