# Online Checkout

This platform-scale specification covers baskets, inventory reservations, payments,
idempotency, receipts, asynchronous fulfillment, compensation, authorization, and
failure handling. Its browser stack pins Pico CSS 2.1.1.

- [`surface.kdl`](./surface.kdl) is the source specification.

## Build the Application

```sh
mise run examples-prepare
cd examples/online-checkout
```

Open your agent in this directory and invoke the build workflow:

```text
Codex:       $surf-build
Claude Code: /surf:build
```

The generated `build/` directory is ignored by Git. Treat generated payment code as a
prototype until it has received an independent security review.
