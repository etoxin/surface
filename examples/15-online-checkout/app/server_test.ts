import { createCheckoutState } from "./domain.ts";
import { createRequestHandler } from "./server.ts";
import { deepStrictEqual, equal } from "./test_helpers.ts";

Deno.test("HTTP handler exposes public basket routes with development authentication", async () => {
  const handler = createRequestHandler(createCheckoutState(), "<p>checkout</p>");
  const unauthorized = await handler(
    new Request("http://local/baskets", { method: "POST" }),
  );
  equal(unauthorized.status, 401);
  deepStrictEqual(await unauthorized.json(), {
    httpStatus: 401,
    errorCode: "unauthenticated",
  });

  const created = await handler(
    new Request("http://local/baskets", {
      method: "POST",
      headers: { "x-dev-user": "alice" },
    }),
  );
  equal(created.status, 201);
  const body = await created.json();
  equal(body.status, "open");

  const fetched = await handler(
    new Request(`http://local/baskets/${body.basketId}`, {
      headers: { "x-dev-user": "alice" },
    }),
  );
  equal(fetched.status, 200);
});
