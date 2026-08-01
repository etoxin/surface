export const CHECKOUT_CURRENCY = "USD";
export const RESERVATION_LIFETIME_SECONDS = 900;
export const FULFILLMENT_RETRY_LIMIT = 8;

export type Role =
  | "customer"
  | "supportAdministrator"
  | "checkoutService"
  | "fulfillmentWorker";

export interface ActorInput {
  actorId?: string;
  actorRoles: Role[];
}

export interface Basket {
  id: string;
  customerId: string;
  status: "open" | "checkingOut" | "completed" | "abandoned";
  currency: string;
  subtotal: number;
  version: number;
}

export interface BasketItem {
  id: string;
  basketId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface StockReservation {
  id: string;
  basketId: string;
  status: "reserved" | "released" | "consumed" | "expired" | "failed";
  lines: Array<{ productId: string; quantity: number }>;
  expiresAt?: string;
  providerReference?: string;
  errorCode?: string;
  retryable?: boolean;
}

export interface PaymentAttempt {
  id: string;
  basketId: string;
  idempotencyKey: string;
  status: "pending" | "captured" | "declined" | "failed" | "refunded";
  amount: number;
  currency: string;
  providerReference?: string;
  errorCode?: string;
  retryable?: boolean;
}

export interface Order {
  id: string;
  basketId: string;
  customerId: string;
  status:
    | "paid"
    | "fulfillmentPending"
    | "fulfilled"
    | "cancelled"
    | "needsAttention";
  total: number;
  currency: string;
  shippingAddress: ShippingAddress;
  createdAt: string;
  items: BasketItem[];
  paymentId: string;
  reservationId: string;
}

export interface Receipt {
  id: string;
  orderId: string;
  paymentId: string;
  number: string;
  total: number;
  currency: string;
  issuedAt: string;
}

export interface Fulfillment {
  id: string;
  orderId: string;
  status: "queued" | "processing" | "shipped" | "delivered" | "failed";
  attemptCount: number;
  nextAttemptAt?: string;
  carrierReference?: string;
  trackingUrl?: string;
  errorCode?: string;
}

export interface ShippingAddress {
  name: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface BasketResponse {
  httpStatus: number;
  basketId?: string;
  status?: Basket["status"];
  currency?: string;
  subtotal?: number;
  version?: number;
  items?: BasketItem[];
  errorCode?: string;
}

export interface CheckoutResult {
  httpStatus: number;
  basketId: string;
  status: "succeeded" | "pending" | "declined" | "unavailable" | "failed";
  orderId?: string;
  paymentId?: string;
  receiptId?: string;
  fulfillmentId?: string;
  errorCode?: string;
  retryable?: boolean;
}

export interface OrderResponse {
  httpStatus: number;
  orderId?: string;
  status?: Order["status"];
  total?: number;
  currency?: string;
  items?: BasketItem[];
  receiptNumber?: string;
  fulfillmentStatus?: Fulfillment["status"];
  trackingUrl?: string;
  errorCode?: string;
}

export type InventoryMode = "available" | "transientFailure";
export type RefundMode = "success" | "transientFailure";
export type CarrierOutcome = "success" | "transientFailure";

interface IdempotentRecord<T> {
  fingerprint: string;
  value: T;
}

export interface CheckoutState {
  baskets: Map<string, Basket>;
  basketItems: Map<string, BasketItem>;
  stockReservations: Map<string, StockReservation>;
  paymentAttempts: Map<string, PaymentAttempt>;
  orders: Map<string, Order>;
  receipts: Map<string, Receipt>;
  fulfillments: Map<string, Fulfillment>;
  catalog: Map<string, { price: number; stock: number }>;
  allowedCountries: Set<string>;
  inventoryMode: InventoryMode;
  refundMode: RefundMode;
  carrierOutcomes: CarrierOutcome[];
  failNextOrderCommit: boolean;
  failNextFulfillmentEnqueue: boolean;
  alerts: string[];
  outbox: string[];
  now: () => Date;
  nextId: number;
  reservationKeys: Map<string, IdempotentRecord<StockReservation>>;
  releaseKeys: Map<string, IdempotentRecord<StockReservation>>;
  paymentKeys: Map<string, IdempotentRecord<PaymentAttempt>>;
  refundKeys: Map<string, IdempotentRecord<PaymentAttempt>>;
  checkoutKeys: Map<string, IdempotentRecord<CheckoutResult>>;
  cancellationKeys: Map<string, IdempotentRecord<OrderResponse>>;
}

export interface StateOptions {
  now?: () => Date;
  allowedCountries?: string[];
  catalog?: Record<string, { price: number; stock: number }>;
}

export function createCheckoutState(options: StateOptions = {}): CheckoutState {
  return {
    baskets: new Map(),
    basketItems: new Map(),
    stockReservations: new Map(),
    paymentAttempts: new Map(),
    orders: new Map(),
    receipts: new Map(),
    fulfillments: new Map(),
    catalog: new Map(Object.entries(
      options.catalog ?? {
        "coffee-beans": { price: 12.5, stock: 10 },
        "tea-tin": { price: 8, stock: 4 },
        "sold-out": { price: 5, stock: 0 },
      },
    )),
    allowedCountries: new Set(options.allowedCountries ?? ["US", "CA"]),
    inventoryMode: "available",
    refundMode: "success",
    carrierOutcomes: [],
    failNextOrderCommit: false,
    failNextFulfillmentEnqueue: false,
    alerts: [],
    outbox: [],
    now: options.now ?? (() => new Date()),
    nextId: 1,
    reservationKeys: new Map(),
    releaseKeys: new Map(),
    paymentKeys: new Map(),
    refundKeys: new Map(),
    checkoutKeys: new Map(),
    cancellationKeys: new Map(),
  };
}

export function createBasket(
  state: CheckoutState,
  input: ActorInput,
): BasketResponse {
  const auth = requireRole(input, "customer");
  if (auth !== undefined) {
    return basketError(auth, auth === 401 ? "unauthenticated" : "forbidden");
  }

  const basket: Basket = {
    id: id(state),
    customerId: input.actorId!,
    status: "open",
    currency: CHECKOUT_CURRENCY,
    subtotal: 0,
    version: 1,
  };
  state.baskets.set(basket.id, basket);
  return basketView(state, basket, 201);
}

export function getBasket(
  state: CheckoutState,
  input: ActorInput & { basketId: string },
): BasketResponse {
  if (!input.actorId) return basketError(401, "unauthenticated");
  const basket = state.baskets.get(input.basketId);
  if (!basket) return basketError(404, "notFound");
  if (basket.customerId !== input.actorId && !hasRole(input, "supportAdministrator")) {
    return basketError(403, "forbidden");
  }
  return basketView(state, basket, 200);
}

export function putBasketItem(
  state: CheckoutState,
  input: ActorInput & {
    basketId: string;
    productId: string;
    quantity: number;
    observedUnitPrice: number;
    expectedVersion: number;
  },
): BasketResponse {
  const auth = requireRole(input, "customer");
  if (auth !== undefined) {
    return basketError(auth, auth === 401 ? "unauthenticated" : "forbidden");
  }
  const basket = state.baskets.get(input.basketId);
  if (!basket) return basketError(404, "notFound");
  if (basket.customerId !== input.actorId) return basketError(403, "forbidden");
  if (basket.status !== "open" || basket.version !== input.expectedVersion) {
    return basketError(409, "versionConflict");
  }
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    return basketError(422, "invalidQuantity");
  }
  if (state.inventoryMode === "transientFailure") {
    return basketError(503, "providerUnavailable");
  }
  const product = state.catalog.get(input.productId);
  if (!product) return basketError(404, "productNotFound");
  if (money(product.price) !== money(input.observedUnitPrice)) {
    return basketError(409, "priceChanged");
  }

  const key = itemKey(basket.id, input.productId);
  const existing = state.basketItems.get(key);
  state.basketItems.set(key, {
    id: existing?.id ?? id(state),
    basketId: basket.id,
    productId: input.productId,
    quantity: input.quantity,
    unitPrice: money(product.price),
  });
  updateSubtotalAndVersion(state, basket);
  return basketView(state, basket, 200);
}

export function deleteBasketItem(
  state: CheckoutState,
  input: ActorInput & {
    basketId: string;
    productId: string;
    expectedVersion: number;
  },
): BasketResponse {
  const auth = requireRole(input, "customer");
  if (auth !== undefined) {
    return basketError(auth, auth === 401 ? "unauthenticated" : "forbidden");
  }
  const basket = state.baskets.get(input.basketId);
  if (!basket) return basketError(404, "notFound");
  if (basket.customerId !== input.actorId) return basketError(403, "forbidden");
  if (basket.status !== "open" || basket.version !== input.expectedVersion) {
    return basketError(409, "versionConflict");
  }
  if (!state.basketItems.delete(itemKey(basket.id, input.productId))) {
    return basketError(404, "itemNotFound");
  }
  updateSubtotalAndVersion(state, basket);
  return basketView(state, basket, 200);
}

export function reserveInventory(
  state: CheckoutState,
  input: {
    basketId: string;
    lines: Array<{ productId: string; quantity: number }>;
    idempotencyKey: string;
    actorRoles: Role[];
  },
): StockReservation {
  if (!input.actorRoles.includes("checkoutService")) {
    return failedReservation(state, input.basketId, input.lines, "forbidden", false);
  }
  const fingerprint = stable({ basketId: input.basketId, lines: input.lines });
  const prior = state.reservationKeys.get(input.idempotencyKey);
  if (prior) {
    return prior.fingerprint === fingerprint ? prior.value : failedReservation(
      state,
      input.basketId,
      input.lines,
      "idempotencyConflict",
      false,
    );
  }
  const distinct = new Set(input.lines.map((line) => line.productId));
  const invalid = input.lines.length === 0 || distinct.size !== input.lines.length ||
    input.lines.some((line) => !Number.isInteger(line.quantity) || line.quantity <= 0);
  if (invalid) {
    const result = failedReservation(
      state,
      input.basketId,
      input.lines,
      "invalidLines",
      false,
    );
    state.reservationKeys.set(input.idempotencyKey, { fingerprint, value: result });
    return result;
  }
  if (state.inventoryMode === "transientFailure") {
    const result = failedReservation(
      state,
      input.basketId,
      input.lines,
      "providerUnavailable",
      true,
    );
    state.reservationKeys.set(input.idempotencyKey, { fingerprint, value: result });
    return result;
  }
  const unavailable = input.lines.some((line) => {
    const product = state.catalog.get(line.productId);
    return !product || product.stock < line.quantity;
  });
  if (unavailable) {
    const result = failedReservation(
      state,
      input.basketId,
      input.lines,
      "unavailable",
      false,
    );
    state.reservationKeys.set(input.idempotencyKey, { fingerprint, value: result });
    return result;
  }
  for (const line of input.lines) {
    state.catalog.get(line.productId)!.stock -= line.quantity;
  }
  const reservation: StockReservation = {
    id: id(state),
    basketId: input.basketId,
    status: "reserved",
    lines: structuredClone(input.lines),
    expiresAt: new Date(state.now().getTime() + RESERVATION_LIFETIME_SECONDS * 1000)
      .toISOString(),
    providerReference: `inv-${state.nextId}`,
  };
  state.stockReservations.set(reservation.id, reservation);
  state.reservationKeys.set(input.idempotencyKey, { fingerprint, value: reservation });
  return reservation;
}

export function releaseInventory(
  state: CheckoutState,
  input: { reservationId: string; idempotencyKey: string; actorRoles: Role[] },
): StockReservation {
  const reservation = state.stockReservations.get(input.reservationId);
  if (!input.actorRoles.includes("checkoutService")) {
    return failedReservation(state, "", [], "forbidden", false);
  }
  if (!reservation) return failedReservation(state, "", [], "notFound", false);
  const fingerprint = stable({ reservationId: input.reservationId });
  const prior = state.releaseKeys.get(input.idempotencyKey);
  if (prior) {
    if (prior.fingerprint !== fingerprint) {
      return failedReservation(
        state,
        reservation.basketId,
        reservation.lines,
        "idempotencyConflict",
        false,
      );
    }
    if (["released", "expired", "consumed"].includes(prior.value.status)) {
      return prior.value;
    }
  }
  if (reservation.status === "released" || reservation.status === "expired") {
    return reservation;
  }
  if (reservation.status === "consumed") return reservation;
  if (state.inventoryMode === "transientFailure") {
    reservation.errorCode = "providerUnavailable";
    reservation.retryable = true;
    state.alerts.push(`inventory-release:${reservation.id}`);
    state.releaseKeys.set(input.idempotencyKey, { fingerprint, value: reservation });
    return reservation;
  }
  for (const line of reservation.lines) {
    const product = state.catalog.get(line.productId);
    if (product) product.stock += line.quantity;
  }
  reservation.status = "released";
  reservation.errorCode = undefined;
  reservation.retryable = undefined;
  state.releaseKeys.set(input.idempotencyKey, { fingerprint, value: reservation });
  return reservation;
}

export function chargePayment(
  state: CheckoutState,
  input: {
    basketId: string;
    amount: number;
    currency: string;
    paymentToken: string;
    idempotencyKey: string;
    actorRoles: Role[];
  },
): PaymentAttempt {
  const fingerprint = stable({
    basketId: input.basketId,
    amount: money(input.amount),
    currency: input.currency,
  });
  if (!input.actorRoles.includes("checkoutService")) {
    return failedPayment(state, input, "forbidden", false);
  }
  const prior = state.paymentKeys.get(input.idempotencyKey);
  if (prior) {
    return prior.fingerprint === fingerprint
      ? prior.value
      : failedPayment(state, input, "idempotencyConflict", false);
  }
  let outcome: Pick<PaymentAttempt, "status" | "errorCode" | "retryable">;
  switch (input.paymentToken) {
    case "tok_decline":
      outcome = { status: "declined", errorCode: "cardDeclined", retryable: false };
      break;
    case "tok_pending":
      outcome = {
        status: "pending",
        errorCode: "providerOutcomeUnknown",
        retryable: true,
      };
      break;
    case "tok_fail":
      outcome = { status: "failed", errorCode: "paymentFailed", retryable: false };
      break;
    default:
      outcome = { status: "captured", errorCode: undefined, retryable: undefined };
  }
  const attempt: PaymentAttempt = {
    id: id(state),
    basketId: input.basketId,
    idempotencyKey: input.idempotencyKey,
    status: outcome.status,
    amount: money(input.amount),
    currency: input.currency,
    providerReference: outcome.status === "captured"
      ? `pay-${state.nextId}`
      : undefined,
    errorCode: outcome.errorCode,
    retryable: outcome.retryable,
  };
  state.paymentAttempts.set(attempt.id, attempt);
  state.paymentKeys.set(input.idempotencyKey, { fingerprint, value: attempt });
  return attempt;
}

export function refundPayment(
  state: CheckoutState,
  input: {
    paymentId: string;
    amount: number;
    idempotencyKey: string;
    actorRoles: Role[];
  },
): PaymentAttempt {
  const payment = state.paymentAttempts.get(input.paymentId);
  const fallback = payment ?? {
    basketId: "",
    amount: input.amount,
    currency: CHECKOUT_CURRENCY,
    paymentToken: "",
    idempotencyKey: input.idempotencyKey,
    actorRoles: input.actorRoles,
  };
  if (!input.actorRoles.includes("checkoutService")) {
    return failedPayment(state, fallback, "forbidden", false);
  }
  if (!payment || money(payment.amount) !== money(input.amount)) {
    return failedPayment(state, fallback, "invalidPayment", false);
  }
  if (payment.status === "refunded") return payment;
  if (payment.status !== "captured") {
    return failedPayment(state, fallback, "notCaptured", false);
  }
  const fingerprint = stable({
    paymentId: input.paymentId,
    amount: money(input.amount),
  });
  const prior = state.refundKeys.get(input.idempotencyKey);
  if (prior?.fingerprint !== undefined && prior.fingerprint !== fingerprint) {
    return failedPayment(state, fallback, "idempotencyConflict", false);
  }
  if (prior?.value.status === "refunded") {
    return prior.value;
  }
  if (state.refundMode === "transientFailure") {
    payment.errorCode = "providerUnavailable";
    payment.retryable = true;
    state.alerts.push(`payment-refund:${payment.id}`);
  } else {
    payment.status = "refunded";
    payment.errorCode = undefined;
    payment.retryable = undefined;
  }
  state.refundKeys.set(input.idempotencyKey, { fingerprint, value: payment });
  return payment;
}

export function issueReceipt(
  state: CheckoutState,
  input: { orderId: string; paymentId: string; actorRoles: Role[] },
): Receipt | null {
  if (!input.actorRoles.includes("checkoutService")) return null;
  const existing = [...state.receipts.values()].find((receipt) =>
    receipt.orderId === input.orderId
  );
  if (existing) return existing;
  const order = state.orders.get(input.orderId);
  const payment = state.paymentAttempts.get(input.paymentId);
  if (
    !order || !payment || !["paid", "fulfillmentPending"].includes(order.status) ||
    payment.status !== "captured" || payment.basketId !== order.basketId ||
    money(payment.amount) !== money(order.total) || payment.currency !== order.currency
  ) return null;
  const receipt: Receipt = {
    id: id(state),
    orderId: order.id,
    paymentId: payment.id,
    number: `R-${String(state.receipts.size + 1).padStart(6, "0")}`,
    total: order.total,
    currency: order.currency,
    issuedAt: state.now().toISOString(),
  };
  state.receipts.set(receipt.id, receipt);
  return receipt;
}

export function enqueueFulfillment(
  state: CheckoutState,
  input: { orderId: string; actorRoles: Role[] },
): Fulfillment | null {
  if (!input.actorRoles.includes("checkoutService")) return null;
  const existing = [...state.fulfillments.values()].find((item) =>
    item.orderId === input.orderId
  );
  if (existing) return existing;
  const order = state.orders.get(input.orderId);
  if (!order || order.status !== "paid" || state.failNextFulfillmentEnqueue) {
    state.failNextFulfillmentEnqueue = false;
    return null;
  }
  const fulfillment: Fulfillment = {
    id: id(state),
    orderId: order.id,
    status: "queued",
    attemptCount: 0,
  };
  state.fulfillments.set(fulfillment.id, fulfillment);
  state.outbox.push(fulfillment.id);
  order.status = "fulfillmentPending";
  return fulfillment;
}

export function runFulfillmentJob(
  state: CheckoutState,
  input: { fulfillmentId: string; actorRoles: Role[] },
): Fulfillment | null {
  if (!input.actorRoles.includes("fulfillmentWorker")) return null;
  const fulfillment = state.fulfillments.get(input.fulfillmentId);
  if (!fulfillment) return null;
  if (
    fulfillment.status === "shipped" || fulfillment.status === "delivered" ||
    fulfillment.status === "failed"
  ) return fulfillment;
  const order = state.orders.get(fulfillment.orderId);
  if (!order || order.status === "cancelled") return fulfillment;
  fulfillment.status = "processing";
  const outcome = state.carrierOutcomes.shift() ?? "success";
  if (outcome === "success") {
    fulfillment.status = "shipped";
    fulfillment.carrierReference = `ship-${order.id.slice(-8)}`;
    fulfillment.trackingUrl =
      `https://carrier.invalid/track/${fulfillment.carrierReference}`;
    fulfillment.nextAttemptAt = undefined;
    fulfillment.errorCode = undefined;
    order.status = "fulfilled";
    state.outbox = state.outbox.filter((id) => id !== fulfillment.id);
    return fulfillment;
  }
  fulfillment.attemptCount += 1;
  fulfillment.errorCode = "carrierUnavailable";
  if (fulfillment.attemptCount < FULFILLMENT_RETRY_LIMIT) {
    fulfillment.status = "queued";
    const delaySeconds = Math.min(2 ** fulfillment.attemptCount, 300);
    fulfillment.nextAttemptAt = new Date(state.now().getTime() + delaySeconds * 1000)
      .toISOString();
  } else {
    fulfillment.status = "failed";
    fulfillment.nextAttemptAt = undefined;
    order.status = "needsAttention";
    state.outbox = state.outbox.filter((id) => id !== fulfillment.id);
    state.alerts.push(`fulfillment-final:${fulfillment.id}`);
  }
  return fulfillment;
}

export function checkoutBasket(
  state: CheckoutState,
  input: ActorInput & {
    basketId: string;
    expectedVersion: number;
    shippingAddress: ShippingAddress;
    paymentToken: string;
    idempotencyKey: string;
  },
): CheckoutResult {
  const auth = requireRole(input, "customer");
  if (auth !== undefined) {
    return checkoutError(
      auth,
      input.basketId,
      "failed",
      auth === 401 ? "unauthenticated" : "forbidden",
    );
  }
  const requestKey = `${input.actorId}:${input.basketId}:${input.idempotencyKey}`;
  const fingerprint = stable({
    actorId: input.actorId,
    basketId: input.basketId,
    expectedVersion: input.expectedVersion,
    shippingAddress: input.shippingAddress,
    paymentTokenHash: secretHash(input.paymentToken),
  });
  const prior = state.checkoutKeys.get(requestKey);
  if (prior) {
    return prior.fingerprint === fingerprint
      ? prior.value
      : checkoutError(409, input.basketId, "failed", "idempotencyConflict");
  }
  const finish = (result: CheckoutResult): CheckoutResult => {
    state.checkoutKeys.set(requestKey, { fingerprint, value: result });
    return result;
  };
  const basket = state.baskets.get(input.basketId);
  if (!basket) return finish(checkoutError(404, input.basketId, "failed", "notFound"));
  if (basket.customerId !== input.actorId) {
    return finish(checkoutError(403, input.basketId, "failed", "forbidden"));
  }
  if (basket.status !== "open" || basket.version !== input.expectedVersion) {
    return finish(checkoutError(409, input.basketId, "failed", "versionConflict"));
  }
  const items = itemsFor(state, basket.id);
  if (
    items.length === 0 ||
    !validAddress(input.shippingAddress, state.allowedCountries) || !input.paymentToken
  ) {
    return finish(checkoutError(422, input.basketId, "failed", "invalidCheckout"));
  }
  if (state.inventoryMode === "transientFailure") {
    return finish(
      checkoutError(503, input.basketId, "pending", "providerUnavailable", true),
    );
  }
  if (
    items.some((item) =>
      money(state.catalog.get(item.productId)?.price ?? -1) !== money(item.unitPrice)
    )
  ) {
    return finish(checkoutError(409, input.basketId, "failed", "priceChanged"));
  }

  basket.status = "checkingOut";
  const serviceRoles: Role[] = ["checkoutService"];
  const reservation = reserveInventory(state, {
    basketId: basket.id,
    lines: items.map(({ productId, quantity }) => ({ productId, quantity })),
    idempotencyKey: `${input.idempotencyKey}:inventory`,
    actorRoles: serviceRoles,
  });
  if (reservation.status !== "reserved") {
    basket.status = "open";
    const pending = reservation.retryable === true;
    return finish(
      checkoutError(
        pending ? 202 : 409,
        basket.id,
        pending ? "pending" : "unavailable",
        reservation.errorCode ?? "unavailable",
        pending,
      ),
    );
  }
  const payment = chargePayment(state, {
    basketId: basket.id,
    amount: basket.subtotal,
    currency: basket.currency,
    paymentToken: input.paymentToken,
    idempotencyKey: `${input.idempotencyKey}:payment`,
    actorRoles: serviceRoles,
  });
  if (payment.status === "pending") {
    return finish(
      checkoutError(
        202,
        basket.id,
        "pending",
        payment.errorCode ?? "paymentPending",
        true,
        payment.id,
      ),
    );
  }
  if (payment.status === "declined" || payment.status === "failed") {
    const released = releaseInventory(state, {
      reservationId: reservation.id,
      idempotencyKey: `${input.idempotencyKey}:release`,
      actorRoles: serviceRoles,
    });
    if (released.status === "released") basket.status = "open";
    if (released.status !== "released") {
      return finish(
        checkoutError(
          202,
          basket.id,
          "pending",
          "compensationPending",
          true,
          payment.id,
        ),
      );
    }
    return finish(
      checkoutError(
        payment.status === "declined" ? 402 : 422,
        basket.id,
        payment.status,
        payment.errorCode ?? "paymentFailed",
        payment.retryable,
        payment.id,
      ),
    );
  }

  if (state.failNextOrderCommit) {
    state.failNextOrderCommit = false;
    const refunded = refundPayment(state, {
      paymentId: payment.id,
      amount: payment.amount,
      idempotencyKey: `${input.idempotencyKey}:refund`,
      actorRoles: serviceRoles,
    });
    const released = releaseInventory(state, {
      reservationId: reservation.id,
      idempotencyKey: `${input.idempotencyKey}:release`,
      actorRoles: serviceRoles,
    });
    const compensated = refunded.status === "refunded" &&
      released.status === "released";
    if (compensated) basket.status = "open";
    else state.alerts.push(`checkout-compensation:${basket.id}`);
    return finish(
      checkoutError(
        compensated ? 500 : 202,
        basket.id,
        compensated ? "failed" : "pending",
        compensated ? "orderCommitFailed" : "compensationPending",
        !compensated,
        payment.id,
      ),
    );
  }

  const order: Order = {
    id: id(state),
    basketId: basket.id,
    customerId: basket.customerId,
    status: "paid",
    total: basket.subtotal,
    currency: basket.currency,
    shippingAddress: structuredClone(input.shippingAddress),
    createdAt: state.now().toISOString(),
    items: structuredClone(items),
    paymentId: payment.id,
    reservationId: reservation.id,
  };
  state.orders.set(order.id, order);
  reservation.status = "consumed";
  basket.status = "completed";
  const receipt = issueReceipt(state, {
    orderId: order.id,
    paymentId: payment.id,
    actorRoles: serviceRoles,
  });
  const fulfillment = enqueueFulfillment(state, {
    orderId: order.id,
    actorRoles: serviceRoles,
  });
  if (!fulfillment) {
    order.status = "needsAttention";
    state.alerts.push(`fulfillment-enqueue:${order.id}`);
  }
  if (!receipt) {
    order.status = "needsAttention";
    state.alerts.push(`receipt:${order.id}`);
  }
  return finish({
    httpStatus: 201,
    basketId: basket.id,
    status: "succeeded",
    orderId: order.id,
    paymentId: payment.id,
    receiptId: receipt?.id,
    fulfillmentId: fulfillment?.id,
  });
}

export function getOrder(
  state: CheckoutState,
  input: ActorInput & { orderId: string },
): OrderResponse {
  if (!input.actorId) return orderError(401, "unauthenticated");
  const order = state.orders.get(input.orderId);
  if (!order) return orderError(404, "notFound");
  if (order.customerId !== input.actorId && !hasRole(input, "supportAdministrator")) {
    return orderError(403, "forbidden");
  }
  return orderView(state, order, 200);
}

export function cancelOrder(
  state: CheckoutState,
  input: ActorInput & { orderId: string; idempotencyKey: string },
): OrderResponse {
  const auth = requireRole(input, "customer");
  if (auth !== undefined) {
    return orderError(auth, auth === 401 ? "unauthenticated" : "forbidden");
  }
  const requestKey = `${input.actorId}:${input.orderId}:${input.idempotencyKey}`;
  const fingerprint = stable({ actorId: input.actorId, orderId: input.orderId });
  const prior = state.cancellationKeys.get(requestKey);
  if (prior && prior.value.httpStatus !== 202) {
    return prior.fingerprint === fingerprint
      ? prior.value
      : orderError(409, "idempotencyConflict");
  }
  const order = state.orders.get(input.orderId);
  if (!order) {
    return rememberCancellation(
      state,
      requestKey,
      fingerprint,
      orderError(404, "notFound"),
    );
  }
  if (order.customerId !== input.actorId && !hasRole(input, "supportAdministrator")) {
    return rememberCancellation(
      state,
      requestKey,
      fingerprint,
      orderError(403, "forbidden"),
    );
  }
  if (order.status === "cancelled") {
    return rememberCancellation(
      state,
      requestKey,
      fingerprint,
      orderView(state, order, 200),
    );
  }
  const fulfillment = [...state.fulfillments.values()].find((item) =>
    item.orderId === order.id
  );
  if (
    fulfillment && ["processing", "shipped", "delivered"].includes(fulfillment.status)
  ) {
    return rememberCancellation(
      state,
      requestKey,
      fingerprint,
      orderError(409, "fulfillmentStarted"),
    );
  }
  const payment = state.paymentAttempts.get(order.paymentId);
  if (!payment) {
    return rememberCancellation(
      state,
      requestKey,
      fingerprint,
      orderError(500, "paymentMissing"),
    );
  }
  const refund = refundPayment(state, {
    paymentId: payment.id,
    amount: payment.amount,
    idempotencyKey: `${input.idempotencyKey}:refund`,
    actorRoles: ["checkoutService"],
  });
  if (refund.status !== "refunded") {
    return rememberCancellation(
      state,
      requestKey,
      fingerprint,
      orderError(202, "refundPending"),
    );
  }
  const reservation = state.stockReservations.get(order.reservationId);
  if (reservation && reservation.status !== "consumed") {
    const release = releaseInventory(state, {
      reservationId: reservation.id,
      idempotencyKey: `${input.idempotencyKey}:release`,
      actorRoles: ["checkoutService"],
    });
    if (release.status !== "released") {
      return rememberCancellation(
        state,
        requestKey,
        fingerprint,
        orderError(202, "releasePending"),
      );
    }
  }
  order.status = "cancelled";
  if (fulfillment?.status === "queued") {
    fulfillment.status = "failed";
    fulfillment.errorCode = "orderCancelled";
    state.outbox = state.outbox.filter((id) => id !== fulfillment.id);
  }
  return rememberCancellation(
    state,
    requestKey,
    fingerprint,
    orderView(state, order, 200),
  );
}

function basketView(
  state: CheckoutState,
  basket: Basket,
  httpStatus: number,
): BasketResponse {
  return {
    httpStatus,
    basketId: basket.id,
    status: basket.status,
    currency: basket.currency,
    subtotal: basket.subtotal,
    version: basket.version,
    items: structuredClone(itemsFor(state, basket.id)),
  };
}

function orderView(
  state: CheckoutState,
  order: Order,
  httpStatus: number,
): OrderResponse {
  const receipt = [...state.receipts.values()].find((item) =>
    item.orderId === order.id
  );
  const fulfillment = [...state.fulfillments.values()].find((item) =>
    item.orderId === order.id
  );
  return {
    httpStatus,
    orderId: order.id,
    status: order.status,
    total: order.total,
    currency: order.currency,
    items: structuredClone(order.items),
    receiptNumber: receipt?.number,
    fulfillmentStatus: fulfillment?.status,
    trackingUrl: fulfillment?.trackingUrl,
  };
}

function itemsFor(state: CheckoutState, basketId: string): BasketItem[] {
  return [...state.basketItems.values()].filter((item) => item.basketId === basketId)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function updateSubtotalAndVersion(state: CheckoutState, basket: Basket): void {
  basket.subtotal = money(
    itemsFor(state, basket.id).reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    ),
  );
  basket.version += 1;
}

function basketError(httpStatus: number, errorCode: string): BasketResponse {
  return { httpStatus, errorCode };
}

function checkoutError(
  httpStatus: number,
  basketId: string,
  status: CheckoutResult["status"],
  errorCode: string,
  retryable?: boolean,
  paymentId?: string,
): CheckoutResult {
  return { httpStatus, basketId, status, errorCode, retryable, paymentId };
}

function orderError(httpStatus: number, errorCode: string): OrderResponse {
  return { httpStatus, errorCode };
}

function failedReservation(
  state: CheckoutState,
  basketId: string,
  lines: Array<{ productId: string; quantity: number }>,
  errorCode: string,
  retryable: boolean,
): StockReservation {
  const reservation: StockReservation = {
    id: id(state),
    basketId,
    status: "failed",
    lines: structuredClone(lines),
    errorCode,
    retryable,
  };
  state.stockReservations.set(reservation.id, reservation);
  return reservation;
}

function failedPayment(
  state: CheckoutState,
  input: { basketId: string; amount: number; currency: string; idempotencyKey: string },
  errorCode: string,
  retryable: boolean,
): PaymentAttempt {
  const payment: PaymentAttempt = {
    id: id(state),
    basketId: input.basketId,
    idempotencyKey: input.idempotencyKey,
    status: "failed",
    amount: money(input.amount),
    currency: input.currency,
    errorCode,
    retryable,
  };
  state.paymentAttempts.set(payment.id, payment);
  return payment;
}

function validAddress(value: ShippingAddress, countries: Set<string>): boolean {
  return Boolean(
    value && value.name?.trim() && value.addressLine1?.trim() && value.city?.trim() &&
      value.postalCode?.trim() && countries.has(value.country?.toUpperCase()),
  );
}

function requireRole(input: ActorInput, role: Role): 401 | 403 | undefined {
  if (!input.actorId) return 401;
  if (!hasRole(input, role)) return 403;
  return undefined;
}

function hasRole(input: ActorInput, role: Role): boolean {
  return input.actorRoles.includes(role);
}

function itemKey(basketId: string, productId: string): string {
  return `${basketId}\u0000${productId}`;
}

function id(state: CheckoutState): string {
  const value = (state.nextId++).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${value}`;
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function secretHash(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${
      Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) =>
        `${JSON.stringify(key)}:${stable(item)}`
      ).join(",")
    }}`;
  }
  return JSON.stringify(value);
}

function rememberCancellation(
  state: CheckoutState,
  key: string,
  fingerprint: string,
  value: OrderResponse,
): OrderResponse {
  state.cancellationKeys.set(key, { fingerprint, value });
  return value;
}
