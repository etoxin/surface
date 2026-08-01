# Online checkout reference decisions

This is a deterministic, single-process reference implementation of the validated
Surface specification. It is deliberately not a production payment system.

## Running

Use Deno and provide placeholder credentials for the two integration boundaries. The
local adapters check that both secrets exist at startup but never persist, return, or
log them.

```sh
INVENTORY_API_TOKEN=local-inventory \
PAYMENT_API_TOKEN=local-payment \
deno run --allow-env --allow-net --allow-read \
  examples/15-online-checkout/app/server.ts
```

Open <http://localhost:8006/checkout>. The UI and API state lasts for the process
lifetime. This loopback reference uses plain HTTP only for local development; its fake
providers make no network calls. A deployment replacing those fakes must terminate HTTPS
for the browser/API and use HTTPS for provider traffic as required by the specification.

## Local integration assumptions

- Inventory is an in-memory catalog: `coffee-beans` costs USD 12.50 with 10 units,
  `tea-tin` costs USD 8.00 with 4 units, and `sold-out` costs USD 5.00 with no stock.
  Reservations are all-or-nothing. Test code can set `inventoryMode` to
  `transientFailure`; production HTTP input cannot.
- Payment tokens are one-time opaque inputs and are not stored or logged. `tok_success`
  (and any unrecognized non-empty token) captures, `tok_decline` declines, `tok_pending`
  models an unknown provider result, and `tok_fail` fails. Provider credential values
  never enter checkout state.
- Carrier outcomes are deterministic. An empty outcome queue succeeds; tests may queue
  `transientFailure` outcomes to exercise backoff and the retry limit. Tracking URLs use
  the reserved `.invalid` domain and do not call an external service.
- The clock and catalog can be injected into `createCheckoutState`. Generated
  identifiers, receipt numbers, provider references, and state transitions are
  deterministic within a state instance.
- The configured shipping-country allowlist defaults to `US` and `CA`.

## Authentication and authorization

The HTTP layer recognizes only the `x-dev-user` header. `alice` and `bob` are customers;
`support` has both customer and `supportAdministrator` roles so it can exercise
support-authorized reads and cancellation. Unknown or absent users are unauthenticated.
Internal checkout and fulfillment roles are never accepted from HTTP headers; domain
orchestration supplies them only to the internal functions described by the
specification.

Authorization errors contain only `httpStatus` and `errorCode`, so basket, order, item,
receipt, payment, and tracking data are not leaked. Browser code also discards protected
data after a user change.

## Transactions, idempotency, and asynchronous work

JavaScript execution within each exported domain operation is synchronous, so the
related in-memory writes form the reference transaction boundary. Idempotency records
include a canonical request fingerprint; payment-token fingerprints use a one-way
non-cryptographic hash solely to avoid retaining the token in this local demonstration.
Reuse with changed input is rejected.

The outbox is an in-memory list. Enqueueing creates the fulfillment and outbox entry
together. `runFulfillmentJob` models at-least-once delivery, duplicate acknowledgement,
exponential backoff, terminal failure, and order status updates. Cancelling a queued
order marks its unstarted work failed with `orderCancelled` and removes its outbox
entry, preventing shipment after a successful cancellation.

The state flags `failNextOrderCommit` and `failNextFulfillmentEnqueue`, along with local
adapter modes, are explicit fault-injection seams for tests. They are not exposed
through the public HTTP API.
