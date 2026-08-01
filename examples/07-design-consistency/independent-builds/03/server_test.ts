import { doesNotMatch, match, strictEqual } from "node:assert/strict";

import { createApp, PORT } from "./server.ts";

Deno.test("createApp serves the page, pinned stylesheet, and only the declared routes", async () => {
  const app = createApp();
  const page = await app(new Request("http://localhost/"));
  strictEqual(page.status, 200);
  strictEqual(page.headers.get("content-type"), "text/html; charset=utf-8");
  const html = await page.text();
  match(html, /href="\/assets\/govuk-frontend\.min\.css"/);

  const stylesheet = await app(
    new Request("http://localhost/assets/govuk-frontend.min.css"),
  );
  strictEqual(stylesheet.status, 200);
  strictEqual(stylesheet.headers.get("content-type"), "text/css; charset=utf-8");

  for (
    const request of [
      new Request("http://localhost/missing"),
      new Request("http://localhost/", { method: "POST" }),
      new Request("http://localhost/assets/govuk-frontend.min.css", {
        method: "POST",
      }),
    ]
  ) {
    const response = await app(request);
    strictEqual(response.status, 404);
    strictEqual(await response.text(), "Not found");
  }
  strictEqual(PORT, 8022);
});

Deno.test("page uses the required GOV.UK components without application CSS", async () => {
  const app = createApp();
  const html = await (await app(new Request("http://localhost/"))).text();

  for (
    const componentClass of [
      "govuk-skip-link",
      "govuk-header",
      "govuk-grid-column-two-thirds",
      "govuk-form-group",
      "govuk-radios",
      "govuk-input",
      "govuk-textarea",
      "govuk-error-summary",
      "govuk-back-link",
      "govuk-summary-list",
      "govuk-button",
      "govuk-panel govuk-panel--confirmation",
      "govuk-footer",
    ]
  ) match(html, new RegExp(componentClass));

  doesNotMatch(html, /<style(?:\s|>)/i);
  doesNotMatch(html, /\sstyle\s*=/i);
  doesNotMatch(html, /govuk-header__logotype|govuk-header__logo/);
});

Deno.test("page contains exact fields, ordered errors, review, and confirmation copy", async () => {
  const html = await (await createApp()(new Request("http://localhost/"))).text();
  for (
    const field of [
      'id="problemType-pothole"',
      'id="problemType-brokenStreetlight"',
      'id="problemType-damagedRoadSign"',
      'id="location"',
      'id="details"',
      'id="reporterEmail"',
    ]
  ) match(html, new RegExp(field));

  const typeError = html.indexOf("Select the type of street problem.");
  const locationError = html.indexOf("Enter where the problem is.");
  const emailError = html.indexOf("Enter a valid email address.");
  strictEqual(
    typeError >= 0 && typeError < locationError && locationError < emailError,
    true,
  );

  for (
    const copy of [
      "Report a street problem",
      "What is the problem?",
      "Pothole",
      "Broken streetlight",
      "Damaged road sign",
      "Where is the problem?",
      "Tell us more (optional)",
      "Email address",
      "Continue",
      "Check your answers before sending your report",
      "Change",
      "Back",
      "Send report",
      "Report submitted",
      "Your reference number",
      "SR-2026-001",
      "We have sent a confirmation to the supplied email address.",
    ]
  ) match(html, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
