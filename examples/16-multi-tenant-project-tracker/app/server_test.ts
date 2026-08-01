import {
  deepStrictEqual as assertEquals,
  match as assertMatch,
  ok as assert,
  strictEqual,
} from "node:assert/strict";

import {
  createDevelopmentState,
  DEVELOPMENT_SHARED_PROJECT_ID,
  DEVELOPMENT_TENANTS,
  DEVELOPMENT_USERS,
} from "./domain.ts";
import { createRequestHandler, PORT, UNAVAILABLE_RESPONSE } from "./server.ts";

const html = "<!doctype html><title>Tracker shell</title><main>tracker</main>";
const atlasId = DEVELOPMENT_TENANTS.atlas.id;
const beaconId = DEVELOPMENT_TENANTS.beacon.id;

function request(
  path: string,
  user = "owner",
  init: RequestInit = {},
): Request {
  const headers = new Headers(init.headers);
  if (user) headers.set("x-dev-user", user);
  if (init.body) headers.set("content-type", "application/json");
  return new Request(`http://localhost:${PORT}${path}`, { ...init, headers });
}

Deno.test("handler serves the accessible UI only at the home route", async () => {
  const handler = createRequestHandler(createDevelopmentState(), html);
  const response = await handler(request("/"));
  strictEqual(response.status, 200);
  strictEqual(response.headers.get("content-type"), "text/html; charset=utf-8");
  assertMatch(response.headers.get("content-security-policy") ?? "", /default-src/);
  strictEqual(await response.text(), html);

  const missing = await handler(request("/other"));
  strictEqual(missing.status, 404);
  assertEquals(await missing.json(), UNAVAILABLE_RESPONSE);
  strictEqual(PORT, 8007);
});

Deno.test("API identity comes only from authentication, never JSON actor fields", async () => {
  const state = createDevelopmentState();
  const handler = createRequestHandler(state, html);
  const unauthenticated = await handler(request("/api/tenants", ""));
  strictEqual(unauthenticated.status, 401);

  const list = await handler(request("/api/tenants", "owner"));
  strictEqual(list.status, 200);
  const listBody = await list.json();
  assertEquals(
    listBody.memberships.map((item: { tenantId: string }) => item.tenantId),
    [
      atlasId,
      beaconId,
    ],
  );

  const create = await handler(request(`/api/tenants/${atlasId}/projects`, "owner", {
    method: "POST",
    body: JSON.stringify({
      actorUserId: DEVELOPMENT_USERS.outsider.id,
      name: "Authenticated actor wins",
    }),
  }));
  strictEqual(create.status, 201);
  const created = await create.json();
  strictEqual(created.tenantId, atlasId);
  assert(created.id);
});

Deno.test("handler makes denied, missing, cross-tenant, and conflict failures indistinguishable", async () => {
  const handler = createRequestHandler(createDevelopmentState(), html);
  const denied = await handler(request(`/api/tenants/${atlasId}/projects`, "viewer", {
    method: "POST",
    body: JSON.stringify({ name: "Denied" }),
  }));
  const missing = await handler(request(
    `/api/tenants/${atlasId}/projects/55555555-5555-4555-8555-555555555555`,
    "owner",
    {
      method: "PUT",
      body: JSON.stringify({ expectedVersion: 1, name: "Missing" }),
    },
  ));
  const crossTenant = await handler(request(
    `/api/tenants/${beaconId}/projects/${DEVELOPMENT_SHARED_PROJECT_ID}`,
    "owner",
    {
      method: "PUT",
      body: JSON.stringify({ expectedVersion: 1, name: "Cross tenant" }),
    },
  ));
  const conflict = await handler(request(
    `/api/tenants/${atlasId}/projects/${DEVELOPMENT_SHARED_PROJECT_ID}`,
    "owner",
    {
      method: "PUT",
      body: JSON.stringify({ expectedVersion: 99, name: "Conflict" }),
    },
  ));

  for (const response of [denied, missing, crossTenant, conflict]) {
    strictEqual(response.status, 404);
    assertEquals(await response.json(), UNAVAILABLE_RESPONSE);
  }
});

Deno.test("the shipped UI includes role gates and stale tenant-response defenses", async () => {
  const shippedHtml = await Deno.readTextFile(new URL("./index.html", import.meta.url));
  assertMatch(shippedHtml, /aria-live="polite"/);
  assertMatch(shippedHtml, /membership-actions/);
  assertMatch(shippedHtml, /requestGeneration/);
  assertMatch(shippedHtml, /generation !== state\.requestGeneration/);
  assertMatch(shippedHtml, /result\.data\.tenantId !== selectedTenantId/);
  assertMatch(shippedHtml, /That operation is unavailable\./);
  assertMatch(
    shippedHtml,
    /\[\s*"owner",\s*"administrator",\s*"contributor",?\s*\]/,
  );
});
