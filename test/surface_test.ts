import {
  deepStrictEqual as assertEquals,
  match as assertMatch,
  ok as assert,
} from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { formatSurface } from "../src/formatter.js";
import { parseKdl, parseSurface } from "../src/surface.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exampleRoot = join(repositoryRoot, "examples", "01-hello-world");
const cli = join(repositoryRoot, "src", "cli.ts");
const decoder = new TextDecoder();

Deno.test("the Hello World specification exports the reviewed IR", async () => {
  const source = await Deno.readTextFile(join(exampleRoot, "surface.kdl"));
  const expected = JSON.parse(
    await Deno.readTextFile(join(exampleRoot, "expected-ir.json")),
  );

  const result = parseSurface(source, "surface.kdl");

  assertEquals(result.diagnostics, []);
  assertEquals(result.ir, expected);
});

Deno.test("all invalid fixtures include their expected diagnostic", async () => {
  const invalidRoot = join(exampleRoot, "invalid");
  const expected = JSON.parse(
    await Deno.readTextFile(join(invalidRoot, "expected-diagnostics.json")),
  );

  for (const [file, code] of Object.entries(expected)) {
    const source = await Deno.readTextFile(join(invalidRoot, file));
    const result = parseSurface(source, file);
    assert(
      result.diagnostics.some((diagnostic) => diagnostic.code === code),
      `${file} should report ${code}`,
    );
    assertEquals(result.ir, null);
  }
});

Deno.test("the formatter is idempotent and preserves comments", () => {
  const source = `/- kdl-version 2

surface "0.1"

// Keep this comment.
application "helloWorld" {
purpose "Display a greeting."
}

screen "home" route="/" {
section "Home" {
context "Keep this prompt."
title "My app"
paragraph "Hello, world!"
}
}
`;

  const first = formatSurface(source, "surface.kdl");
  assertEquals(first.diagnostics, []);
  assert(first.output !== null);
  assertMatch(first.output, /\/\/ Keep this comment\./);
  assertMatch(first.output, /context "Keep this prompt\."/);
  assertMatch(first.output, /^[ ]{4}purpose/m);
  assertMatch(first.output, /^[ ]{4}section/m);
  assertMatch(first.output, /^[ ]{8}title/m);
  assertMatch(first.output, /^[ ]{8}paragraph/m);

  const second = formatSurface(first.output, "surface.kdl");
  assertEquals(second.output, first.output);
});

Deno.test("the parser reports KDL syntax locations", () => {
  const result = parseKdl('application "broken" {\n', "broken.kdl");
  assertEquals(result.document, null);
  assertEquals(result.diagnostics[0].code, "SURF-KDL-002");
  assertEquals(result.diagnostics[0].file, "broken.kdl");
  assertEquals(typeof result.diagnostics[0].line, "number");
  assertEquals(typeof result.diagnostics[0].column, "number");
});

Deno.test("screen and section order is retained in the IR", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "ordered" { purpose "Check ordering." }
screen "first" route="/first" {
    section "A" {
        title "First"
        paragraph "A1"
        paragraph "A2"
    }
    section "B" { paragraph "B1" }
}
screen "second" route="/second" {
    section "C" { paragraph "C1" }
}
`;

  const result = parseSurface(source, "ordered.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(
    result.ir.screens.map(({ id }: { id: string }) => id),
    ["first", "second"],
  );
  assertEquals(
    result.ir.screens[0].sections.map(({ name }: { name: string }) => name),
    ["A", "B"],
  );
  assertEquals(result.ir.screens[0].sections[0], {
    name: "A",
    title: "First",
    paragraphs: ["A1", "A2"],
  });
});

Deno.test("section title and screen route are optional and omitted from the IR", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "nativeApp" { purpose "Run without a website." }
screen "home" {
    section "Home" { paragraph "Hello, world!" }
}
`;

  const result = parseSurface(source, "native.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(result.ir.screens[0], {
    id: "home",
    sections: [{
      name: "Home",
      paragraphs: ["Hello, world!"],
    }],
  });
});

Deno.test("context is valid on every Surface node and omitted from the IR", () => {
  const source = `/- kdl-version 2

surface "0.1" {
    context "Document guidance."
}
application "contextual" {
    context "Application guidance."
    purpose "Exercise universal context." {
        context "Purpose guidance."
    }
}
screen "home" {
    context "Screen guidance."
    section "Home" {
        context "Section guidance."
        title "My app" {
            context "Title guidance."
        }
        paragraph "Hello, world!" {
            context "Paragraph guidance."
        }
    }
}
`;

  const result = parseSurface(source, "context.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assert(!JSON.stringify(result.ir).includes("guidance"));
  assertEquals(result.ir.screens[0].sections[0], {
    name: "Home",
    title: "My app",
    paragraphs: ["Hello, world!"],
  });
});

Deno.test("CLI check and export succeed for the valid example", () => {
  const specification = join(exampleRoot, "surface.kdl");
  const checked = runCli(["check", specification]);
  assertEquals(checked.code, 0, decoder.decode(checked.stderr));
  assertMatch(decoder.decode(checked.stdout), /^OK /);

  const exported = runCli(["export", specification, "--format", "json"]);
  assertEquals(exported.code, 0, decoder.decode(exported.stderr));
  assertEquals(
    JSON.parse(decoder.decode(exported.stdout)).application.id,
    "helloWorld",
  );
});

Deno.test("CLI check fails with a structured diagnostic for invalid Surface", () => {
  const specification = join(
    exampleRoot,
    "invalid",
    "missing-application.kdl",
  );
  const checked = runCli(["check", specification]);
  const stderr = decoder.decode(checked.stderr);

  assertEquals(checked.code, 1);
  assertMatch(stderr, /SURF-APP-001/);
  assertMatch(stderr, /Suggested correction:/);
});

Deno.test("CLI format updates a file in place without losing comments", async () => {
  const temporaryDirectory = await Deno.makeTempDir({
    prefix: "surface-format-test-",
  });
  const temporaryFile = join(temporaryDirectory, "surface.kdl");
  const source = `/- kdl-version 2

surface "0.1"
// Retain me.
application "helloWorld" {
purpose "Display a greeting."
}
screen "home" route="/" {
section "Home" {
title "My app"
paragraph "Hello, world!"
}
}
`;

  try {
    await Deno.writeTextFile(temporaryFile, source);
    const formatted = runCli(["format", temporaryFile]);
    assertEquals(formatted.code, 0, decoder.decode(formatted.stderr));

    const output = await Deno.readTextFile(temporaryFile);
    assertMatch(output, /\/\/ Retain me\./);
    assertMatch(output, /^[ ]{4}purpose/m);
    assertMatch(output, /^[ ]{4}section/m);
    assertMatch(output, /^[ ]{8}title/m);
    assertMatch(output, /^[ ]{8}paragraph/m);
  } finally {
    await Deno.remove(temporaryDirectory, { recursive: true });
  }
});

Deno.test("the implemented page matches the Surface section", async () => {
  const html = await Deno.readTextFile(join(exampleRoot, "app", "index.html"));
  assertMatch(html, /<h1>My app<\/h1>/);
  assertMatch(html, /<p>Hello, world!<\/p>/);
});

Deno.test("the skill defines all three required forward evaluations", async () => {
  const evaluations = JSON.parse(
    await Deno.readTextFile(join(repositoryRoot, "test", "skill-evaluations.json")),
  );

  assertEquals(evaluations.rung, 1);
  assertEquals(
    evaluations.cases.map(({ id }: { id: string }) => id),
    ["create", "modify", "diagnose"],
  );
  assert(
    evaluations.cases.every(
      ({ acceptance }: { acceptance: string[] }) => acceptance.length > 0,
    ),
  );
});

function runCli(arguments_: string[]): Deno.CommandOutput {
  return new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--quiet",
      "--allow-read",
      "--allow-write",
      cli,
      ...arguments_,
    ],
    stdout: "piped",
    stderr: "piped",
  }).outputSync();
}
