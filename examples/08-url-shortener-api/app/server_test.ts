import {
  deepStrictEqual as assertEquals,
  match as assertMatch,
} from "node:assert/strict";

import {
  createShortLink,
  DEVELOPMENT_CREDENTIAL,
  handleShortLinkRequest,
  type ShortLink,
  SqliteShortLinkStore,
} from "./server.ts";

Deno.test("POST /links creates and persists a short link", async () => {
  const store = new SqliteShortLinkStore(":memory:");
  try {
    const response = await handleShortLinkRequest(
      new Request("http://localhost/links", {
        method: "POST",
        headers: {
          authorization: DEVELOPMENT_CREDENTIAL,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          destination: "https://example.com/docs",
          customSlug: "docs",
        }),
      }),
      store,
    );
    const body = await response.json();

    assertEquals(response.status, 201);
    assertEquals(body.httpStatus, 201);
    assertMatch(body.id, /^[0-9a-f-]{36}$/);
    assertEquals(body.destination, "https://example.com/docs");
    assertEquals(body.slug, "docs");
    assertEquals(body.shortUrl, "https://sho.rt/docs");
    assertEquals(body.protected, false);
    assertEquals(store.findBySlug("docs"), {
      id: body.id,
      destination: body.destination,
      slug: body.slug,
      shortUrl: body.shortUrl,
      createdAt: body.createdAt,
      protected: false,
    });
  } finally {
    store.close();
  }
});

Deno.test("GET /{slug} resolves an unprotected short link", async () => {
  const store = new SqliteShortLinkStore(":memory:");
  try {
    const created = createShortLink(
      {
        destination: "https://example.com/guide",
        customSlug: "guide",
        authorization: DEVELOPMENT_CREDENTIAL,
      },
      store,
    );
    assertEquals(created.httpStatus, 201);

    const response = await handleShortLinkRequest(
      new Request("http://localhost/guide"),
      store,
    );

    assertEquals(response.status, 302);
    assertEquals(response.headers.get("location"), "https://example.com/guide");
    assertEquals(await response.json(), {
      httpStatus: 302,
      location: "https://example.com/guide",
    });
  } finally {
    store.close();
  }
});

Deno.test("custom slugs are unique", () => {
  const store = new SqliteShortLinkStore(":memory:");
  try {
    const input = {
      destination: "https://example.com/",
      customSlug: "taken",
      authorization: DEVELOPMENT_CREDENTIAL,
    };

    assertEquals(createShortLink(input, store).httpStatus, 201);
    assertEquals(createShortLink(input, store), {
      httpStatus: 409,
      error: "Slug already exists",
    });
  } finally {
    store.close();
  }
});

Deno.test("creation and protected resolution enforce authorization", async () => {
  const store = new SqliteShortLinkStore(":memory:");
  try {
    const unauthorized = await handleShortLinkRequest(
      new Request("http://localhost/links", {
        method: "POST",
        body: "not JSON",
      }),
      store,
    );
    assertEquals(unauthorized.status, 401);

    const protectedLink: ShortLink = {
      id: "00000000-0000-4000-8000-000000000001",
      destination: "https://example.com/private",
      slug: "private",
      shortUrl: "https://sho.rt/private",
      createdAt: "2026-01-01T00:00:00.000Z",
      protected: true,
    };
    assertEquals(store.insert(protectedLink), true);

    const missingCredential = await handleShortLinkRequest(
      new Request("http://localhost/private"),
      store,
    );
    assertEquals(missingCredential.status, 401);

    const invalidCredential = await handleShortLinkRequest(
      new Request("http://localhost/private", {
        headers: { authorization: "Bearer wrong" },
      }),
      store,
    );
    assertEquals(invalidCredential.status, 403);

    const authorized = await handleShortLinkRequest(
      new Request("http://localhost/private", {
        headers: { authorization: DEVELOPMENT_CREDENTIAL },
      }),
      store,
    );
    assertEquals(authorized.status, 302);
    assertEquals(
      authorized.headers.get("location"),
      "https://example.com/private",
    );
  } finally {
    store.close();
  }
});

Deno.test("an unknown slug returns not found", async () => {
  const store = new SqliteShortLinkStore(":memory:");
  try {
    const response = await handleShortLinkRequest(
      new Request("http://localhost/missing"),
      store,
    );

    assertEquals(response.status, 404);
    assertEquals(await response.json(), {
      httpStatus: 404,
      error: "Short link not found",
    });
  } finally {
    store.close();
  }
});
