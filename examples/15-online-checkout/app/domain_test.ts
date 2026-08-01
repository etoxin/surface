import {
  cancelOrder,
  checkoutBasket,
  type CheckoutResult,
  type CheckoutState,
  createBasket,
  createCheckoutState,
  getBasket,
  getOrder,
  putBasketItem,
  runFulfillmentJob,
  type ShippingAddress,
} from "./domain.ts";
import { deepStrictEqual, equal, ok } from "./test_helpers.ts";

const alice = {
  actorId: "10000000-0000-4000-8000-000000000001",
  actorRoles: ["customer" as const],
};
const bob = {
  actorId: "10000000-0000-4000-8000-000000000002",
  actorRoles: ["customer" as const],
};
const address: ShippingAddress = {
  name: "Alice Example",
  addressLine1: "1 Market Street",
  city: "San Francisco",
  postalCode: "94105",
  country: "US",
};

function basketWithItem(
  state: CheckoutState,
  productId = "coffee-beans",
  observedUnitPrice = 12.5,
  quantity = 2,
) {
  const created = createBasket(state, alice);
  equal(created.httpStatus, 201);
  const updated = putBasketItem(state, {
    ...alice,
    basketId: created.basketId!,
    productId,
    quantity,
    observedUnitPrice,
    expectedVersion: created.version!,
  });
  equal(updated.httpStatus, 200);
  return updated;
}

function checkout(
  state: CheckoutState,
  paymentToken = "tok_success",
  key = "checkout-1",
): CheckoutResult {
  const basket = basketWithItem(state);
  return checkoutBasket(state, {
    ...alice,
    basketId: basket.basketId!,
    expectedVersion: basket.version!,
    shippingAddress: address,
    paymentToken,
    idempotencyKey: key,
  });
}

Deno.test("successful checkout reserves, captures, creates a receipt, and queues fulfillment", () => {
  const state = createCheckoutState({ now: () => new Date("2026-01-02T03:04:05Z") });
  const result = checkout(state);

  equal(result.httpStatus, 201);
  equal(result.status, "succeeded");
  equal(state.orders.size, 1);
  equal(state.receipts.size, 1);
  equal(state.fulfillments.size, 1);
  equal(state.paymentAttempts.get(result.paymentId!)?.status, "captured");
  equal(state.baskets.get(result.basketId)?.status, "completed");
  equal(state.catalog.get("coffee-beans")?.stock, 8);
});

Deno.test("an identical checkout idempotency key returns the original result without duplicate charge", () => {
  const state = createCheckoutState();
  const basket = basketWithItem(state);
  const input = {
    ...alice,
    basketId: basket.basketId!,
    expectedVersion: basket.version!,
    shippingAddress: address,
    paymentToken: "tok_success",
    idempotencyKey: "same-key",
  };
  const first = checkoutBasket(state, input);
  const second = checkoutBasket(state, input);

  deepStrictEqual(second, first);
  equal(state.paymentAttempts.size, 1);
  equal(state.orders.size, 1);
  const conflict = checkoutBasket(state, {
    ...input,
    shippingAddress: { ...address, city: "Oakland" },
  });
  equal(conflict.httpStatus, 409);
  equal(conflict.errorCode, "idempotencyConflict");
});

Deno.test("stock rejection does not charge and payment decline releases reserved stock", () => {
  const soldOutState = createCheckoutState();
  const soldOut = basketWithItem(soldOutState, "sold-out", 5, 1);
  const unavailable = checkoutBasket(soldOutState, {
    ...alice,
    basketId: soldOut.basketId!,
    expectedVersion: soldOut.version!,
    shippingAddress: address,
    paymentToken: "tok_success",
    idempotencyKey: "stock-failure",
  });
  equal(unavailable.status, "unavailable");
  equal(soldOutState.paymentAttempts.size, 0);
  equal(soldOutState.baskets.get(soldOut.basketId!)?.status, "open");

  const declinedState = createCheckoutState();
  const declined = checkout(declinedState, "tok_decline", "decline");
  equal(declined.status, "declined");
  equal(declinedState.catalog.get("coffee-beans")?.stock, 10);
  equal([...declinedState.stockReservations.values()][0].status, "released");
  equal(declinedState.orders.size, 0);
});

Deno.test("authorization failures return no protected basket or order fields", () => {
  const state = createCheckoutState();
  const basket = basketWithItem(state);
  const forbiddenBasket = getBasket(state, { ...bob, basketId: basket.basketId! });
  deepStrictEqual(forbiddenBasket, { httpStatus: 403, errorCode: "forbidden" });
  deepStrictEqual(getBasket(state, { actorRoles: [], basketId: basket.basketId! }), {
    httpStatus: 401,
    errorCode: "unauthenticated",
  });

  const completed = checkoutBasket(state, {
    ...alice,
    basketId: basket.basketId!,
    expectedVersion: basket.version!,
    shippingAddress: address,
    paymentToken: "tok_success",
    idempotencyKey: "auth-order",
  });
  const forbiddenOrder = getOrder(state, { ...bob, orderId: completed.orderId! });
  deepStrictEqual(forbiddenOrder, { httpStatus: 403, errorCode: "forbidden" });
  equal("total" in forbiddenOrder, false);
});

Deno.test("a failed order commit refunds payment and releases inventory before reopening basket", () => {
  const state = createCheckoutState();
  state.failNextOrderCommit = true;
  const result = checkout(state, "tok_success", "commit-failure");

  equal(result.status, "failed");
  equal(result.httpStatus, 500);
  equal(state.orders.size, 0);
  equal(state.paymentAttempts.get(result.paymentId!)?.status, "refunded");
  equal([...state.stockReservations.values()][0].status, "released");
  equal(state.baskets.get(result.basketId)?.status, "open");
  equal(state.catalog.get("coffee-beans")?.stock, 10);
});

Deno.test("cancellation refunds once, cancels queued fulfillment, and is idempotent", () => {
  const state = createCheckoutState();
  const completed = checkout(state, "tok_success", "cancel-checkout");
  const input = { ...alice, orderId: completed.orderId!, idempotencyKey: "cancel-1" };
  const first = cancelOrder(state, input);
  const second = cancelOrder(state, input);

  equal(first.httpStatus, 200);
  equal(first.status, "cancelled");
  deepStrictEqual(second, first);
  equal(state.paymentAttempts.get(completed.paymentId!)?.status, "refunded");
  equal(state.fulfillments.get(completed.fulfillmentId!)?.errorCode, "orderCancelled");
  equal(state.outbox.length, 0);
});

Deno.test("retrying a pending cancellation reuses its key and completes compensation", () => {
  const state = createCheckoutState();
  const completed = checkout(state, "tok_success", "retry-cancel-checkout");
  const input = {
    ...alice,
    orderId: completed.orderId!,
    idempotencyKey: "retry-cancel",
  };
  state.refundMode = "transientFailure";
  const pending = cancelOrder(state, input);
  equal(pending.httpStatus, 202);
  equal(state.orders.get(completed.orderId!)?.status, "fulfillmentPending");

  state.refundMode = "success";
  const cancelled = cancelOrder(state, input);
  equal(cancelled.httpStatus, 200);
  equal(cancelled.status, "cancelled");
  equal(state.paymentAttempts.size, 1);
});

Deno.test("fulfillment retries transient carrier failure then ships exactly once", () => {
  const state = createCheckoutState({ now: () => new Date("2026-01-02T03:04:05Z") });
  state.carrierOutcomes.push("transientFailure", "success");
  const completed = checkout(state, "tok_success", "fulfill");
  const input = {
    fulfillmentId: completed.fulfillmentId!,
    actorRoles: ["fulfillmentWorker" as const],
  };
  const retry = runFulfillmentJob(state, input);
  equal(retry?.status, "queued");
  equal(retry?.attemptCount, 1);
  equal(retry?.nextAttemptAt, "2026-01-02T03:04:07.000Z");

  const shipped = runFulfillmentJob(state, input);
  equal(shipped?.status, "shipped");
  ok(shipped?.trackingUrl);
  equal(state.orders.get(completed.orderId!)?.status, "fulfilled");
  const duplicate = runFulfillmentJob(state, input);
  equal(duplicate?.carrierReference, shipped?.carrierReference);
  equal(state.outbox.length, 0);
});
