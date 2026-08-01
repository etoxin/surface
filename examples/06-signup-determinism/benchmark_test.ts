import {
  deepStrictEqual as assertEquals,
  match as assertMatch,
  notStrictEqual as assertNotEquals,
  ok as assert,
} from "node:assert/strict";

import { createApp as createFunctionalApp } from "./builds/01-functional/server.ts";
import { createApp as createObjectApp } from "./builds/02-object/server.ts";
import { createApp as createPipelineApp } from "./builds/03-pipeline/server.ts";

type App = (request: Request) => Promise<Response>;

const builds: Array<{ name: string; createApp: () => App }> = [
  { name: "01-functional", createApp: createFunctionalApp },
  { name: "02-object", createApp: createObjectApp },
  { name: "03-pipeline", createApp: createPipelineApp },
];

const invalidErrors = [
  { field: "email", message: "Enter a valid email address." },
  {
    field: "password",
    message: "Use at least 12 characters with uppercase, lowercase, and a number.",
  },
  { field: "confirmPassword", message: "Passwords must match." },
  { field: "acceptedTerms", message: "Accept the terms to continue." },
];

for (const build of builds) {
  Deno.test(`${build.name} follows the shared signup contract`, async () => {
    const app = build.createApp();

    const page = await app(new Request("http://surface.local/"));
    assertEquals(page.status, 200);
    const html = await page.text();
    assertMatch(html, /@picocss\/pico@2/);
    assertMatch(html, /id="email"/);
    assertMatch(html, /id="password"/);
    assertMatch(html, /id="confirmPassword"/);
    assertMatch(html, /id="acceptedTerms"/);
    assertMatch(html, /Create account/);
    assertMatch(html, /role="status"/);

    const invalid = await register(app, {
      email: "not-an-email",
      password: "short",
      confirmPassword: "different",
      acceptedTerms: false,
    });
    assertEquals(invalid.status, 422);
    assertEquals(await invalid.json(), {
      httpStatus: 422,
      status: "invalid",
      errors: invalidErrors,
    });

    const created = await register(app, validInput("  PERSON@Example.COM "));
    assertEquals(created.status, 201);
    const createdBody = await created.json();
    assertEquals(createdBody.httpStatus, 201);
    assertEquals(createdBody.status, "success");
    assertEquals(Object.keys(createdBody).sort(), [
      "accountId",
      "httpStatus",
      "status",
    ]);
    assertMatch(
      createdBody.accountId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );

    const duplicate = await register(app, validInput("person@example.com"));
    assertEquals(duplicate.status, 409);
    assertEquals(await duplicate.json(), {
      httpStatus: 409,
      status: "conflict",
      errors: [{
        field: "email",
        message: "An account already exists for this email.",
      }],
    });

    const missing = await app(new Request("http://surface.local/missing"));
    assertEquals(missing.status, 404);
  });
}

Deno.test("all builds produce the same observable result sequence", async () => {
  const snapshots = [];
  for (const build of builds) {
    const app = build.createApp();
    const invalid = await register(app, {
      email: "bad",
      password: "bad",
      confirmPassword: "different",
      acceptedTerms: false,
    });
    const success = await register(app, validInput("TEST@example.com"));
    const conflict = await register(app, validInput(" test@EXAMPLE.com "));
    const successBody = await success.json();
    successBody.accountId = "<uuid>";
    snapshots.push([
      { status: invalid.status, body: await invalid.json() },
      { status: success.status, body: successBody },
      { status: conflict.status, body: await conflict.json() },
    ]);
  }
  assertEquals(snapshots[1], snapshots[0]);
  assertEquals(snapshots[2], snapshots[0]);
});

Deno.test("the three implementations are structurally distinct", async () => {
  const serverSources = await Promise.all(
    builds.map(({ name }) =>
      Deno.readTextFile(new URL(`./builds/${name}/server.ts`, import.meta.url))
    ),
  );
  const htmlSources = await Promise.all(
    builds.map(({ name }) =>
      Deno.readTextFile(new URL(`./builds/${name}/index.html`, import.meta.url))
    ),
  );
  const serverHashes = await Promise.all(serverSources.map(hash));
  const htmlHashes = await Promise.all(htmlSources.map(hash));

  assertEquals(new Set(serverHashes).size, 3);
  assertEquals(new Set(htmlHashes).size, 3);
  assertNotEquals(serverSources[0], serverSources[1]);
  assert(htmlSources.every((source) => source.includes("pico@2")));
});

function validInput(email: string): Record<string, unknown> {
  return {
    email,
    password: "StrongPassword9",
    confirmPassword: "StrongPassword9",
    acceptedTerms: true,
  };
}

function register(app: App, body: Record<string, unknown>): Promise<Response> {
  return app(
    new Request("http://surface.local/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function hash(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  )
    .join("");
}
