import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { formatSurface } from "../src/formatter.js";
import { parseKdl, parseSurface } from "../src/surface.js";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const exampleRoot = path.join(repositoryRoot, "examples", "01-hello-world");
const cli = path.join(repositoryRoot, "src", "cli.js");

test("the Hello World specification exports the reviewed IR", async () => {
  const source = await readFile(path.join(exampleRoot, "surface.kdl"), "utf8");
  const expected = JSON.parse(
    await readFile(path.join(exampleRoot, "expected-ir.json"), "utf8"),
  );

  const result = parseSurface(source, "surface.kdl");

  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.ir, expected);
});

test("all invalid fixtures include their expected diagnostic", async () => {
  const invalidRoot = path.join(exampleRoot, "invalid");
  const expected = JSON.parse(
    await readFile(path.join(invalidRoot, "expected-diagnostics.json"), "utf8"),
  );

  for (const [file, code] of Object.entries(expected)) {
    const source = await readFile(path.join(invalidRoot, file), "utf8");
    const result = parseSurface(source, file);
    assert.equal(
      result.diagnostics.some((diagnostic) => diagnostic.code === code),
      true,
      `${file} should report ${code}`,
    );
    assert.equal(result.ir, null);
  }
});

test("the formatter is idempotent and preserves comments", () => {
  const source = `/- kdl-version 2

surface-lang "0.1"

// Keep this comment.
application "helloWorld" version="0.1.0" {
purpose "Display a greeting."
}

screen "home" route="/" {
section "Hello, world!"
}
`;

  const first = formatSurface(source, "surface.kdl");
  assert.deepEqual(first.diagnostics, []);
  assert.match(first.output, /\/\/ Keep this comment\./);
  assert.match(first.output, /^    purpose/m);
  assert.match(first.output, /^    section/m);

  const second = formatSurface(first.output, "surface.kdl");
  assert.equal(second.output, first.output);
});

test("the parser reports KDL syntax locations", () => {
  const result = parseKdl('application "broken" {\n', "broken.kdl");
  assert.equal(result.document, null);
  assert.equal(result.diagnostics[0].code, "SURF-KDL-002");
  assert.equal(result.diagnostics[0].file, "broken.kdl");
  assert.equal(typeof result.diagnostics[0].line, "number");
  assert.equal(typeof result.diagnostics[0].column, "number");
});

test("screen and section order is retained in the IR", () => {
  const source = `/- kdl-version 2

surface-lang "0.1"
application "ordered" version="1" { purpose "Check ordering." }
screen "first" route="/first" {
    section "A"
    section "B"
}
screen "second" route="/second" { section "C" }
`;

  const result = parseSurface(source, "ordered.kdl");
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.ir.screens.map(({ id }) => id),
    ["first", "second"],
  );
  assert.deepEqual(result.ir.screens[0].sections, ["A", "B"]);
});

test("CLI check and export succeed for the valid example", () => {
  const specification = path.join(exampleRoot, "surface.kdl");
  const checked = spawnSync(process.execPath, [cli, "check", specification], {
    encoding: "utf8",
  });
  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stdout, /^OK /);

  const exported = execFileSync(
    process.execPath,
    [cli, "export", specification, "--format", "json"],
    { encoding: "utf8" },
  );
  assert.equal(JSON.parse(exported).application.id, "helloWorld");
});

test("CLI check fails with a structured diagnostic for invalid Surface", () => {
  const specification = path.join(
    exampleRoot,
    "invalid",
    "missing-application.kdl",
  );
  const checked = spawnSync(process.execPath, [cli, "check", specification], {
    encoding: "utf8",
  });

  assert.equal(checked.status, 1);
  assert.match(checked.stderr, /SURF-APP-001/);
  assert.match(checked.stderr, /Suggested correction:/);
});

test("CLI format updates a file in place without losing comments", async () => {
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "surface-format-test-"),
  );
  const temporaryFile = path.join(temporaryDirectory, "surface.kdl");
  const source = `/- kdl-version 2

surface-lang "0.1"
// Retain me.
application "helloWorld" version="0.1.0" {
purpose "Display a greeting."
}
screen "home" route="/" {
section "Hello, world!"
}
`;

  try {
    await writeFile(temporaryFile, source, "utf8");
    const formatted = spawnSync(
      process.execPath,
      [cli, "format", temporaryFile],
      { encoding: "utf8" },
    );
    assert.equal(formatted.status, 0, formatted.stderr);

    const output = await readFile(temporaryFile, "utf8");
    assert.match(output, /\/\/ Retain me\./);
    assert.match(output, /^    purpose/m);
    assert.match(output, /^    section/m);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("the implemented page matches the Surface section", async () => {
  const html = await readFile(path.join(exampleRoot, "app", "index.html"), "utf8");
  assert.match(html, /<h1>Hello, world!<\/h1>/);
});

test("the skill defines all three required forward evaluations", async () => {
  const evaluations = JSON.parse(
    await readFile(path.join(repositoryRoot, "test", "skill-evaluations.json"), "utf8"),
  );

  assert.equal(evaluations.rung, 1);
  assert.deepEqual(
    evaluations.cases.map(({ id }) => id),
    ["create", "modify", "diagnose"],
  );
  assert.equal(
    evaluations.cases.every(({ acceptance }) => acceptance.length > 0),
    true,
  );
});
