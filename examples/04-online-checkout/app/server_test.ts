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

Deno.test("the shipped checkout UI uses the pinned design system", async () => {
  const html = await Deno.readTextFile(new URL("./index.html", import.meta.url));
  equal(html.includes("/assets/pico.min.css"), true);
  equal(html.includes('<main class="container">'), true);

  const handler = createRequestHandler(createCheckoutState(), html);
  const stylesheet = await handler(
    new Request("http://local/assets/pico.min.css"),
  );
  equal(stylesheet.status, 200);
  equal(stylesheet.headers.get("content-type"), "text/css; charset=utf-8");
  equal((await stylesheet.text()).length > 80_000, true);
});
