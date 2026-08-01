/// <reference lib="dom" />

import { type Browser, chromium, type Page } from "playwright";
import { createApp as createRenderFunctionsApp } from "./builds/01-render-functions/server.ts";
import { createApp as createTemplateClonesApp } from "./builds/02-template-clones/server.ts";
import { createApp as createControllerApp } from "./builds/03-controller/server.ts";
import { createApp as createIndependentOneApp } from "./independent-builds/01/server.ts";
import { createApp as createIndependentTwoApp } from "./independent-builds/02/server.ts";
import { createApp as createIndependentThreeApp } from "./independent-builds/03/server.ts";

type App = (request: Request) => Promise<Response>;
type StateName = "initial" | "error" | "review" | "confirmation";
type Viewport = { name: string; width: number; height: number };

const exampleRoot = new URL("./", import.meta.url);
const independentMode = Deno.args.includes("--independent");
const artifactRoot = new URL(
  independentMode ? "./independent-artifacts/" : "./artifacts/",
  exampleRoot,
);
const coordinatedBuilds: Array<{
  name: string;
  port: number;
  createApp: () => App;
}> = [
  { name: "01-render-functions", port: 8120, createApp: createRenderFunctionsApp },
  { name: "02-template-clones", port: 8121, createApp: createTemplateClonesApp },
  { name: "03-controller", port: 8122, createApp: createControllerApp },
];
const independentBuilds: Array<{
  name: string;
  port: number;
  createApp: () => App;
}> = [
  { name: "01-independent", port: 8130, createApp: createIndependentOneApp },
  { name: "02-independent", port: 8131, createApp: createIndependentTwoApp },
  { name: "03-independent", port: 8132, createApp: createIndependentThreeApp },
];
const builds = independentMode ? independentBuilds : coordinatedBuilds;
const viewports: Viewport[] = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];
const states: StateName[] = ["initial", "error", "review", "confirmation"];

await Deno.mkdir(new URL("screenshots/", artifactRoot), { recursive: true });
const servers = builds.map(({ port, createApp }) =>
  Deno.serve(
    { hostname: "127.0.0.1", port, onListen: () => {} },
    createApp(),
  )
);

let browser: Browser | undefined;
try {
  browser = await launchBrowser();
  const componentSignatures: Record<string, Record<string, string>> = {};

  for (const viewport of viewports) {
    componentSignatures[viewport.name] = {};

    for (const build of builds) {
      const page = await browser.newPage({ viewport });
      try {
        await page.goto(`http://127.0.0.1:${build.port}/`);
        await page.evaluate(() => document.fonts.ready);
        await assertAccessibleShell(page, !independentMode);

        for (const state of states) {
          if (state === "error") {
            await execute(
              page,
              "document.getElementById('report-form').requestSubmit(); return true;",
            );
            await page.waitForSelector(".govuk-error-summary");
            assert(
              await execute<boolean>(
                page,
                "return document.querySelector('.govuk-error-summary') === document.activeElement",
              ),
              `${build.name} must focus the error summary`,
            );
            assert(
              (await page.title()).startsWith("Error:"),
              `${build.name} must prefix the error page title`,
            );
          } else if (state === "review") {
            await execute(
              page,
              `
                document.querySelector('[name=problemType][value=pothole]').checked = true;
                document.getElementById('location').value = '1 Market Street';
                document.getElementById('details').value = 'Outside the library';
                document.getElementById('reporterEmail').value = '  PERSON@Example.COM ';
                document.getElementById('report-form').requestSubmit();
                return true;
              `,
            );
            await page.waitForFunction(
              "Array.from(document.querySelectorAll('h1')).some(node => node.offsetParent !== null && node.textContent.includes('Check your answers'))",
            );
            assertEquals(
              await execute<string[]>(
                page,
                "return Array.from(document.querySelectorAll('.govuk-summary-list__value'), node => node.textContent.trim())",
              ),
              [
                "Pothole",
                "1 Market Street",
                "Outside the library",
                "person@example.com",
              ],
            );
          } else if (state === "confirmation") {
            await execute(
              page,
              "document.querySelector('#send-report, [data-action=send]').click(); return true;",
            );
            await page.waitForFunction(
              "Array.from(document.querySelectorAll('h1')).some(node => node.offsetParent !== null && node.textContent.trim() === 'Report submitted')",
            );
            assertEquals(
              await execute<string>(
                page,
                "return document.querySelector('.govuk-panel__body strong').textContent.trim()",
              ),
              "SR-2026-001",
            );
          }

          await page.evaluate(() => globalThis.scrollTo(0, 0));
          await page.waitForTimeout(50);
          const directory = new URL(`screenshots/${viewport.name}/`, artifactRoot);
          await Deno.mkdir(directory, { recursive: true });
          const screenshot = await page.screenshot();
          await Deno.writeFile(
            new URL(`${state}-${build.name}.png`, directory),
            screenshot,
          );
          componentSignatures[viewport.name][`${state}:${build.name}`] =
            await componentSignature(page);
        }
      } finally {
        await page.close();
      }
    }
  }

  const comparisonPage = await browser.newPage();
  const comparisons = [];
  try {
    for (const viewport of viewports) {
      for (const state of states) {
        const baseline = new URL(
          `screenshots/${viewport.name}/${state}-${builds[0].name}.png`,
          artifactRoot,
        );
        for (const candidate of builds.slice(1)) {
          const target = new URL(
            `screenshots/${viewport.name}/${state}-${candidate.name}.png`,
            artifactRoot,
          );
          const mismatchRatio = await compareImages(
            comparisonPage,
            baseline,
            target,
          );
          const componentSignatureEqual = componentSignatures[viewport.name][
            `${state}:${builds[0].name}`
          ] === componentSignatures[viewport.name][`${state}:${candidate.name}`];
          comparisons.push({
            viewport: viewport.name,
            state,
            baseline: builds[0].name,
            candidate: candidate.name,
            mismatchRatio,
            similarity: 1 - mismatchRatio,
            componentSignatureEqual,
          });
        }
      }
    }
  } finally {
    await comparisonPage.close();
  }

  const minimumSimilarity = Math.min(
    ...comparisons.map(({ similarity }) => similarity),
  );
  const exactMatches = comparisons.filter(({ mismatchRatio }) => mismatchRatio === 0)
    .length;
  const componentMatches = comparisons.filter(({ componentSignatureEqual }) =>
    componentSignatureEqual
  ).length;
  const report = {
    generationMode: independentMode ? "independent" : "coordinated",
    browser: `Chromium ${browser.version()}`,
    designSystem: "GOV.UK Frontend 6.4.0",
    builds: builds.map(({ name }) => name),
    viewports,
    states,
    comparisonCount: comparisons.length,
    exactMatches,
    componentMatches,
    minimumSimilarity,
    passThreshold: 0.98,
    passed: minimumSimilarity >= 0.98 && componentMatches === comparisons.length,
    comparisons,
  };
  await Deno.writeTextFile(
    new URL("visual-report.json", artifactRoot),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
  if (!independentMode) {
    assert(
      report.passed,
      "The design consistency benchmark did not meet its threshold",
    );
  }
} finally {
  await browser?.close();
  await Promise.all(servers.map((server) => server.shutdown()));
}

async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Executable doesn't exist")) {
      throw new Error(
        "Playwright Chromium is not installed. Run `mise run design-browser-install` and try again.",
        { cause: error },
      );
    }
    throw error;
  }
}

function execute<T = unknown>(page: Page, script: string): Promise<T> {
  return page.evaluate(script) as Promise<T>;
}

async function assertAccessibleShell(
  page: Page,
  requireOneHeading: boolean,
): Promise<void> {
  const result = await execute<Record<string, unknown>>(
    page,
    `
      return {
        headingCount: document.querySelectorAll('h1').length,
        mainCount: document.querySelectorAll('#main-content').length,
        skipLinkCount: document.querySelectorAll('.govuk-skip-link').length,
        styleElementCount: document.querySelectorAll('style').length,
        styleAttributeCount: document.querySelectorAll('[style]').length,
        stylesheet: document.querySelector('link[rel=stylesheet]')?.getAttribute('href')
      };
    `,
  );
  if (requireOneHeading) {
    assertEquals(result, {
      headingCount: 1,
      mainCount: 1,
      skipLinkCount: 1,
      styleElementCount: 0,
      styleAttributeCount: 0,
      stylesheet: "/assets/govuk-frontend.min.css",
    });
    return;
  }
  assert(Number(result.headingCount) >= 1, "The page must contain a heading");
  assert(result.mainCount === 1, "The page must contain one main landmark");
  assert(result.skipLinkCount === 1, "The page must contain one skip link");
  assert(result.styleElementCount === 0, "The page must not contain custom styles");
  assert(
    result.styleAttributeCount === 0,
    "The page must not contain style attributes",
  );
  assert(
    result.stylesheet === "/assets/govuk-frontend.min.css",
    "The page must use the pinned stylesheet route",
  );
}

function componentSignature(page: Page): Promise<string> {
  return execute<string>(
    page,
    `
      const classes = Array.from(document.querySelectorAll('[class*="govuk-"]'))
        .flatMap(element => Array.from(element.classList))
        .filter(className => className.startsWith('govuk-'))
        .sort();
      const counts = classes.reduce((result, className) => {
        result[className] = (result[className] || 0) + 1;
        return result;
      }, {});
      return JSON.stringify(counts);
    `,
  );
}

async function compareImages(
  page: Page,
  baseline: URL,
  candidate: URL,
): Promise<number> {
  const [baselineBytes, candidateBytes] = await Promise.all([
    Deno.readFile(baseline),
    Deno.readFile(candidate),
  ]);
  return await page.evaluate(
    async ({ baselineSource, candidateSource }) => {
      const load = (source: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error("Could not decode screenshot"));
          image.src = source;
        });
      const [left, right] = await Promise.all([
        load(baselineSource),
        load(candidateSource),
      ]);
      if (left.width !== right.width || left.height !== right.height) return 1;

      const canvas = document.createElement("canvas");
      canvas.width = left.width;
      canvas.height = left.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not create a canvas context");
      context.drawImage(left, 0, 0);
      const leftPixels = context.getImageData(0, 0, left.width, left.height).data;
      context.clearRect(0, 0, left.width, left.height);
      context.drawImage(right, 0, 0);
      const rightPixels = context.getImageData(0, 0, right.width, right.height).data;
      let mismatched = 0;
      for (let index = 0; index < leftPixels.length; index += 4) {
        const difference = Math.max(
          Math.abs(leftPixels[index] - rightPixels[index]),
          Math.abs(leftPixels[index + 1] - rightPixels[index + 1]),
          Math.abs(leftPixels[index + 2] - rightPixels[index + 2]),
          Math.abs(leftPixels[index + 3] - rightPixels[index + 3]),
        );
        if (difference > 16) mismatched += 1;
      }
      return mismatched / (left.width * left.height);
    },
    {
      baselineSource: `data:image/png;base64,${toBase64(baselineBytes)}`,
      candidateSource: `data:image/png;base64,${toBase64(candidateBytes)}`,
    },
  );
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown): void {
  if (stableJson(actual) !== stableJson(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${
      entries.map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(
        ",",
      )
    }}`;
  }
  return JSON.stringify(value);
}
