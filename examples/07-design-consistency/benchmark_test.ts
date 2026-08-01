import {
  deepStrictEqual as assertEquals,
  match as assertMatch,
  notStrictEqual as assertNotEquals,
  ok as assert,
} from "node:assert/strict";

import { createApp as createRenderFunctionsApp } from "./builds/01-render-functions/server.ts";
import { createApp as createTemplateClonesApp } from "./builds/02-template-clones/server.ts";
import { createApp as createControllerApp } from "./builds/03-controller/server.ts";

type App = (request: Request) => Promise<Response>;

const builds: Array<{ name: string; createApp: () => App }> = [
  { name: "01-render-functions", createApp: createRenderFunctionsApp },
  { name: "02-template-clones", createApp: createTemplateClonesApp },
  { name: "03-controller", createApp: createControllerApp },
];

const requiredClasses = [
  "govuk-template",
  "govuk-template__body",
  "govuk-skip-link",
  "govuk-generic-header",
  "govuk-width-container",
  "govuk-grid-column-two-thirds",
  "govuk-heading-xl",
  "govuk-fieldset",
  "govuk-radios",
  "govuk-input",
  "govuk-textarea",
  "govuk-button",
  "govuk-error-summary",
  "govuk-summary-list",
  "govuk-panel--confirmation",
  "govuk-footer",
];

for (const build of builds) {
  Deno.test(`${build.name} serves the pinned design-system application`, async () => {
    const app = build.createApp();
    const response = await app(new Request("http://surface.local/"));
    assertEquals(response.status, 200);
    assertMatch(response.headers.get("content-type") ?? "", /^text\/html/);
    const html = await response.text();

    assertMatch(html, /Northbridge Council/);
    assertMatch(html, /Report a street problem/);
    assertMatch(html, /\/assets\/govuk-frontend\.min\.css/);
    assert(!/<style(?:\s|>)/i.test(html));
    assert(!/\sstyle\s*=/i.test(html));
    assert(!/<(?:link|script|img)[^>]+(?:href|src)="https?:\/\//i.test(html));
    for (const className of requiredClasses) {
      assert(
        html.includes(className),
        `${build.name} should include ${className}`,
      );
    }

    const stylesheet = await app(
      new Request("http://surface.local/assets/govuk-frontend.min.css"),
    );
    assertEquals(stylesheet.status, 200);
    assertMatch(stylesheet.headers.get("content-type") ?? "", /^text\/css/);
    const css = await stylesheet.text();
    assert(css.length > 100_000);
    assertMatch(css, /Helvetica Neue/);
    assertMatch(css, /#006853/);
    assert(!css.includes("/assets/fonts"));

    assertEquals(
      (await app(new Request("http://surface.local/missing"))).status,
      404,
    );
    assertEquals(
      (await app(
        new Request("http://surface.local/", { method: "POST" }),
      )).status,
      404,
    );
  });
}

Deno.test("all builds use the same local GOV.UK Frontend asset", async () => {
  const hashes = [];
  for (const build of builds) {
    const response = await build.createApp()(
      new Request("http://surface.local/assets/govuk-frontend.min.css"),
    );
    hashes.push(await hash(new Uint8Array(await response.arrayBuffer())));
  }
  assertEquals(hashes[1], hashes[0]);
  assertEquals(hashes[2], hashes[0]);
});

Deno.test("the three design implementations are structurally distinct", async () => {
  const html = await Promise.all(
    builds.map(({ name }) =>
      Deno.readTextFile(new URL(`./builds/${name}/index.html`, import.meta.url))
    ),
  );
  const servers = await Promise.all(
    builds.map(({ name }) =>
      Deno.readTextFile(new URL(`./builds/${name}/server.ts`, import.meta.url))
    ),
  );
  const htmlHashes = await Promise.all(
    html.map((source) => hash(new TextEncoder().encode(source))),
  );
  const serverHashes = await Promise.all(
    servers.map((source) => hash(new TextEncoder().encode(source))),
  );

  assertEquals(new Set(htmlHashes).size, 3);
  assertEquals(new Set(serverHashes).size, 3);
  assertNotEquals(html[0], html[1]);
});

async function hash(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new Uint8Array(bytes).buffer,
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}
