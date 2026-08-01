import { createApp as createIndependentOneApp } from "./independent-builds/01/server.ts";
import { createApp as createIndependentTwoApp } from "./independent-builds/02/server.ts";
import { createApp as createIndependentThreeApp } from "./independent-builds/03/server.ts";

type App = (request: Request) => Promise<Response>;

const builds: Array<{
  name: string;
  source: URL;
  createApp: () => App;
}> = [
  {
    name: "01-independent",
    source: new URL("./independent-builds/01/server.ts", import.meta.url),
    createApp: createIndependentOneApp,
  },
  {
    name: "02-independent",
    source: new URL("./independent-builds/02/server.ts", import.meta.url),
    createApp: createIndependentTwoApp,
  },
  {
    name: "03-independent",
    source: new URL("./independent-builds/03/server.ts", import.meta.url),
    createApp: createIndependentThreeApp,
  },
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
const requiredText = [
  "Northbridge Council",
  "Report a street problem",
  "What is the problem?",
  "Pothole",
  "Broken streetlight",
  "Damaged road sign",
  "Where is the problem?",
  "Tell us more (optional)",
  "Email address",
  "Select the type of street problem.",
  "Enter where the problem is.",
  "Enter a valid email address.",
  "Check your answers",
  "Report submitted",
  "SR-2026-001",
];

const results = [];
for (const build of builds) {
  const app = build.createApp();
  const [root, stylesheet, missing, post] = await Promise.all([
    app(new Request("http://surface.local/")),
    app(new Request("http://surface.local/assets/govuk-frontend.min.css")),
    app(new Request("http://surface.local/missing")),
    app(new Request("http://surface.local/", { method: "POST" })),
  ]);
  const [html, css, source] = await Promise.all([
    root.text(),
    stylesheet.text(),
    Deno.readTextFile(build.source),
  ]);
  const missingClasses = requiredClasses.filter((className) =>
    !html.includes(className)
  );
  const missingText = requiredText.filter((text) => !html.includes(text));
  const errorPositions = [
    "Select the type of street problem.",
    "Enter where the problem is.",
    "Enter a valid email address.",
  ].map((message) => html.indexOf(message));
  const checks = {
    rootRoute: root.status === 200,
    htmlContentType: root.headers.get("content-type")?.startsWith("text/html") ??
      false,
    stylesheetRoute: stylesheet.status === 200,
    stylesheetContentType:
      stylesheet.headers.get("content-type")?.startsWith("text/css") ?? false,
    stylesheetPinned: css.length > 100_000 && css.includes("Helvetica Neue") &&
      css.includes("#006853"),
    missingRoute: missing.status === 404,
    unsupportedMethod: post.status === 404,
    noCustomCss: !/<style(?:\s|>)/i.test(html) && !/\sstyle\s*=/i.test(html),
    noRemoteAssets: !/<(?:link|script|img)[^>]+(?:href|src)="https?:\/\//i.test(
      html,
    ),
    requiredClasses: missingClasses.length === 0,
    requiredText: missingText.length === 0,
    validationOrder: errorPositions.every((position) => position >= 0) &&
      errorPositions[0] < errorPositions[1] &&
      errorPositions[1] < errorPositions[2],
  };
  results.push({
    name: build.name,
    sourceHash: await hash(source),
    htmlHash: await hash(html),
    missingClasses,
    missingText,
    checks,
    passed: Object.values(checks).every(Boolean),
  });
}

const report = {
  generationMode: "independent",
  frozenInputs: ["surface.kdl", "brief.md", "skills/surface/SKILL.md"],
  builds: results,
  uniqueSourceHashes: new Set(results.map(({ sourceHash }) => sourceHash)).size,
  uniqueHtmlHashes: new Set(results.map(({ htmlHash }) => htmlHash)).size,
  passedBuilds: results.filter(({ passed }) => passed).length,
  passed: results.every(({ passed }) => passed),
};
const artifactRoot = new URL("./independent-artifacts/", import.meta.url);
await Deno.mkdir(artifactRoot, { recursive: true });
await Deno.writeTextFile(
  new URL("contract-report.json", artifactRoot),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}
