import {
  cancelOrder,
  checkoutBasket,
  type CheckoutState,
  createBasket,
  createCheckoutState,
  deleteBasketItem,
  getBasket,
  getOrder,
  putBasketItem,
  type Role,
  type ShippingAddress,
} from "./domain.ts";

export const PORT = 8006;

export const DEVELOPMENT_USERS: Record<
  string,
  { actorId: string; actorRoles: Role[]; label: string }
> = {
  alice: {
    actorId: "10000000-0000-4000-8000-000000000001",
    actorRoles: ["customer"],
    label: "Alice (customer)",
  },
  bob: {
    actorId: "10000000-0000-4000-8000-000000000002",
    actorRoles: ["customer"],
    label: "Bob (customer)",
  },
  support: {
    actorId: "10000000-0000-4000-8000-000000000099",
    actorRoles: ["customer", "supportAdministrator"],
    label: "Support (customer + support administrator)",
  },
};

interface StartOptions {
  state?: CheckoutState;
  inventoryApiToken?: string;
  paymentApiToken?: string;
  port?: number;
}

export function createRequestHandler(
  state: CheckoutState,
  html: string,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return Response.redirect(new URL("/checkout", url), 302);
    }
    if (
      request.method === "GET" &&
      (url.pathname === "/checkout" || /^\/orders\/[^/]+$/.test(url.pathname))
    ) {
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy":
            "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'",
        },
      });
    }

    const actor = authenticate(request);
    try {
      if (request.method === "POST" && url.pathname === "/baskets") {
        return json(createBasket(state, actor));
      }
      const basketMatch = url.pathname.match(/^\/baskets\/([^/]+)$/);
      if (request.method === "GET" && basketMatch) {
        return json(getBasket(state, { ...actor, basketId: decode(basketMatch[1]) }));
      }
      const itemMatch = url.pathname.match(/^\/baskets\/([^/]+)\/items\/([^/]+)$/);
      if (request.method === "PUT" && itemMatch) {
        const body = await readObject(request);
        return json(putBasketItem(state, {
          ...actor,
          basketId: decode(itemMatch[1]),
          productId: decode(itemMatch[2]),
          quantity: number(body.quantity),
          observedUnitPrice: number(body.observedUnitPrice),
          expectedVersion: number(body.expectedVersion),
        }));
      }
      if (request.method === "DELETE" && itemMatch) {
        const body = await readObject(request);
        return json(deleteBasketItem(state, {
          ...actor,
          basketId: decode(itemMatch[1]),
          productId: decode(itemMatch[2]),
          expectedVersion: number(body.expectedVersion),
        }));
      }
      const checkoutMatch = url.pathname.match(/^\/baskets\/([^/]+)\/checkout$/);
      if (request.method === "POST" && checkoutMatch) {
        const body = await readObject(request);
        return json(checkoutBasket(state, {
          ...actor,
          basketId: decode(checkoutMatch[1]),
          expectedVersion: number(body.expectedVersion),
          shippingAddress: body.shippingAddress as ShippingAddress,
          paymentToken: string(body.paymentToken),
          idempotencyKey: string(body.idempotencyKey),
        }));
      }
      const orderMatch = url.pathname.match(/^\/orders\/([^/]+)$/);
      if (request.method === "GET" && orderMatch) {
        return json(getOrder(state, { ...actor, orderId: decode(orderMatch[1]) }));
      }
      const cancelMatch = url.pathname.match(/^\/orders\/([^/]+)\/cancel$/);
      if (request.method === "POST" && cancelMatch) {
        const body = await readObject(request);
        return json(cancelOrder(state, {
          ...actor,
          orderId: decode(cancelMatch[1]),
          idempotencyKey: string(body.idempotencyKey),
        }));
      }
      return json({ httpStatus: 404, errorCode: "notFound" });
    } catch (error) {
      if (error instanceof RequestError) {
        return json({ httpStatus: 400, errorCode: "invalidRequest" });
      }
      throw error;
    }
  };
}

export async function startServer(
  options: StartOptions = {},
): Promise<Deno.HttpServer> {
  const inventoryApiToken = options.inventoryApiToken ??
    Deno.env.get("INVENTORY_API_TOKEN");
  const paymentApiToken = options.paymentApiToken ?? Deno.env.get("PAYMENT_API_TOKEN");
  if (!inventoryApiToken || !paymentApiToken) {
    throw new Error("INVENTORY_API_TOKEN and PAYMENT_API_TOKEN are required");
  }
  // The secrets satisfy the integration boundary but are intentionally never
  // copied into application state, responses, or logs by the local adapters.
  const html = await Deno.readTextFile(new URL("./index.html", import.meta.url));
  const state = options.state ?? createCheckoutState();
  const port = options.port ?? PORT;
  console.log(`Online Checkout: http://localhost:${port}/checkout`);
  return Deno.serve({ port }, createRequestHandler(state, html));
}

function authenticate(request: Request): { actorId?: string; actorRoles: Role[] } {
  const user = DEVELOPMENT_USERS[request.headers.get("x-dev-user") ?? ""];
  return user
    ? { actorId: user.actorId, actorRoles: [...user.actorRoles] }
    : { actorRoles: [] };
}

function json<T extends { httpStatus: number }>(value: T): Response {
  return Response.json(value, {
    status: value.httpStatus,
    headers: { "cache-control": "no-store" },
  });
}

async function readObject(request: Request): Promise<Record<string, unknown>> {
  if (
    !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")
  ) {
    throw new RequestError();
  }
  const value: unknown = await request.json().catch(() => {
    throw new RequestError();
  });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestError();
  }
  return value as Record<string, unknown>;
}

function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new RequestError();
  return value;
}

function string(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) throw new RequestError();
  return value;
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new RequestError();
  }
}

class RequestError extends Error {}

if (import.meta.main) await startServer();
