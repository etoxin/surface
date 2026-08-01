import {
  deepStrictEqual as assertEquals,
  match as assertMatch,
  ok as assert,
} from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  handleContactRequest,
  renderContactPage,
} from "../examples/03-contact-viewer/app/server.ts";
import { formatSurface } from "../src/formatter.ts";
import { parseKdl, parseSurface } from "../src/surface.ts";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exampleRoot = join(repositoryRoot, "examples", "01-hello-world");
const faqExampleRoot = join(repositoryRoot, "examples", "02-static-faq");
const contactExampleRoot = join(
  repositoryRoot,
  "examples",
  "03-contact-viewer",
);
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

Deno.test("the Static FAQ specification exports the reviewed IR", async () => {
  const source = await Deno.readTextFile(join(faqExampleRoot, "surface.kdl"));
  const expected = JSON.parse(
    await Deno.readTextFile(join(faqExampleRoot, "expected-ir.json")),
  );

  const result = parseSurface(source, "surface.kdl");

  assertEquals(result.diagnostics, []);
  assertEquals(result.ir, expected);
});

Deno.test("the Contact Viewer specification exports the reviewed IR", async () => {
  const source = await Deno.readTextFile(join(contactExampleRoot, "surface.kdl"));
  const expected = JSON.parse(
    await Deno.readTextFile(join(contactExampleRoot, "expected-ir.json")),
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
  const fixtures = [];
  for await (const entry of Deno.readDir(invalidRoot)) {
    if (entry.isFile && entry.name.endsWith(".kdl")) {
      fixtures.push(entry.name);
    }
  }
  assertEquals(Object.keys(expected).sort(), fixtures.sort());

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

Deno.test(
  "the Static FAQ invalid fixtures report their expected diagnostics",
  async () => {
    const invalidRoot = join(faqExampleRoot, "invalid");
    const expected = JSON.parse(
      await Deno.readTextFile(join(invalidRoot, "expected-diagnostics.json")),
    );
    const fixtures = [];
    for await (const entry of Deno.readDir(invalidRoot)) {
      if (entry.isFile && entry.name.endsWith(".kdl")) {
        fixtures.push(entry.name);
      }
    }
    assertEquals(Object.keys(expected).sort(), fixtures.sort());

    for (const [file, code] of Object.entries(expected)) {
      const source = await Deno.readTextFile(join(invalidRoot, file));
      const result = parseSurface(source, file);
      assert(
        result.diagnostics.some((diagnostic) => diagnostic.code === code),
        `${file} should report ${code}`,
      );
      assertEquals(result.ir, null);
    }
  },
);

Deno.test(
  "the Contact Viewer invalid fixtures report their expected diagnostics",
  async () => {
    const invalidRoot = join(contactExampleRoot, "invalid");
    const expected = JSON.parse(
      await Deno.readTextFile(join(invalidRoot, "expected-diagnostics.json")),
    );
    const fixtures = [];
    for await (const entry of Deno.readDir(invalidRoot)) {
      if (entry.isFile && entry.name.endsWith(".kdl")) {
        fixtures.push(entry.name);
      }
    }
    assertEquals(Object.keys(expected).sort(), fixtures.sort());

    for (const [file, code] of Object.entries(expected)) {
      const source = await Deno.readTextFile(join(invalidRoot, file));
      const result = parseSurface(source, file);
      assert(
        result.diagnostics.some((diagnostic) => diagnostic.code === code),
        `${file} should report ${code}`,
      );
      if (file === "wrong-reference-type.kdl") {
        assertEquals(
          result.diagnostics.map((diagnostic) => diagnostic.code),
          ["SURF-REF-003"],
        );
      }
      assertEquals(result.ir, null);
    }
  },
);

Deno.test("the formatter is idempotent and preserves comments", () => {
  const source = `/- kdl-version 2

surface "0.1"

// Keep this comment.
application "helloWorld" {
purpose "Display a greeting."
}

interface "helloWorld" {
context "Keep this prompt."
}

screen "home" route="/" {
use (interface)"helloWorld"
}
`;

  const first = formatSurface(source, "surface.kdl");
  assertEquals(first.diagnostics, []);
  assert(first.output !== null);
  assertMatch(first.output, /\/\/ Keep this comment\./);
  assertMatch(first.output, /context "Keep this prompt\."/);
  assertMatch(first.output, /^[ ]{4}purpose/m);
  assertMatch(first.output, /^[ ]{4}context/m);
  assertMatch(first.output, /^[ ]{4}use/m);

  const second = formatSurface(first.output, "surface.kdl");
  assertEquals(second.output, first.output);
});

Deno.test("the formatter preserves multiline context and its indentation", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "faq" { purpose "Answer questions." }
interface "faq" {
// Keep this question.
context """
The answer text is preserved.

So are {braces} inside the string.
"""
}
screen "faq" {
use (interface)"faq"
}
`;

  const before = parseSurface(source, "faq.kdl");
  assertEquals(before.diagnostics, []);

  const first = formatSurface(source, "faq.kdl");
  assertEquals(first.diagnostics, []);
  assert(first.output !== null);
  assertMatch(first.output, /\/\/ Keep this question\./);
  assertMatch(first.output, /^[ ]{4}context """/m);
  assertMatch(first.output, /^[ ]{8}The answer text is preserved\./m);

  const after = parseSurface(first.output, "faq.kdl");
  assertEquals(after.diagnostics, []);
  assertEquals(after.ir, before.ir);

  const second = formatSurface(first.output, "faq.kdl");
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

Deno.test("interface and screen order is retained in the IR", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "ordered" { purpose "Check ordering." }
interface "first" { context "Render the first interface." }
interface "second" { context "Render the second interface." }
screen "first" route="/first" { use (interface)"first" }
screen "second" route="/second" { use (interface)"second" }
`;

  const result = parseSurface(source, "ordered.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(
    result.ir.interfaces?.map(({ id }: { id: string }) => id),
    ["first", "second"],
  );
  assertEquals(
    result.ir.screens.map(({ id }: { id: string }) => id),
    ["first", "second"],
  );
});

Deno.test("screen route is optional and omitted from the IR", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "nativeApp" { purpose "Run without a website." }
interface "home" { context "Render a native interface." }
screen "home" {
    use (interface)"home"
}
`;

  const result = parseSurface(source, "native.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(result.ir.screens[0], {
    id: "home",
    interface: "home",
  });
});

Deno.test("a context-only screen can describe non-visual route behavior", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "routing" { purpose "Describe a routed application." }
screen "home" route="/" {
    context (screen)"contact" "Redirect to this screen."
}
interface "contact" { context "Render contact details." }
screen "contact" route="/contacts" {
    use (interface)"contact"
}
`;

  const result = parseSurface(source, "context-only-screen.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(result.ir.screens[0], {
    id: "home",
    route: "/",
  });

  const empty = parseSurface(
    `/- kdl-version 2
surface "0.1"
application "emptyScreen" { purpose "Reject an empty screen." }
screen "home" {}
`,
    "empty-screen.kdl",
  );
  assert(empty.diagnostics.some(({ code }) => code === "SURF-CHILD-003"));
});

Deno.test("context resolves typed references before its final prompt", () => {
  const source = `/- kdl-version 2

surface "0.1" {
    context (application)"references" "Apply this application guidance."
}
application "references" { purpose "Exercise context references." }
entity "contact" { (string)"id" }
query "getContact" {
    entity "lookup" { (string)"id" }
    context (entity)"lookup" (entity)"contact" (interface)"contact" (screen)"contact" "Use these declarations together."
    returns (entity)"contact"
}
screen "home" route="/" {
    context (query)"getContact" (interface)"contact" (screen)"contact" "Delegate to these declarations."
}
interface "contact" { context "Render contact details." }
screen "contact" route="/contacts" {
    use (interface)"contact"
}
`;

  const result = parseSurface(source, "context-references.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assert(!JSON.stringify(result.ir).includes("Use these declarations together"));

  const invalid = parseSurface(
    `/- kdl-version 2
surface "0.1"
application "invalidReferences" { purpose "Reject invalid references." }
screen "home" {
    context "contact" "The first argument needs a type."
    context (string)"contact" "The type is unsupported."
    context (screen)"missing" "The target must resolve."
}
`,
    "invalid-context-references.kdl",
  );
  assert(invalid.diagnostics.some(({ code }) => code === "SURF-REF-003"));
  assert(invalid.diagnostics.some(({ code }) => code === "SURF-REF-002"));
  assert(invalid.diagnostics.some(({ code }) => code === "SURF-REF-001"));
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
interface "home" {
    context "Interface guidance."
}
screen "home" {
    context "Screen guidance."
    use (interface)"home" {
        context "Use guidance."
    }
}
`;

  const result = parseSurface(source, "context.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assert(!JSON.stringify(result.ir).includes("guidance"));
  assertEquals(result.ir.interfaces, [{ id: "home" }]);
  assertEquals(result.ir.screens, [{ id: "home", interface: "home" }]);
});

Deno.test("context is valid on rung-3 nodes and omitted from the IR", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "contextual" { purpose "Exercise rung-3 context." }
entity "contact" {
    context "Entity guidance."
    (string)"id" {
        context "Field guidance."
    }
}
query "contactById" {
    context "Query guidance."
    entity "contactLookup" {
        context "Private entity guidance."
        (string)"id" {
            context "Private field guidance."
        }
    }
    input (entity)"contactLookup" {
        context "Input guidance."
    }
    returns (entity)"contact" {
        context "Return guidance."
    }
    context "Return null when no contact matches."
}
interface "contact" {
    context (query)"contactById" (entity)"contact" "Interface guidance."
}
screen "contact" {
    use (interface)"contact" {
        context "Interface reference guidance."
    }
}
`;

  const result = parseSurface(source, "context-rung-3.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assert(!JSON.stringify(result.ir).includes("guidance"));
});

Deno.test("query entity references resolve private and global scopes", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "scopedQuery" { purpose "Exercise scoped entities." }
entity "lookup" {
    (string)"id"
}
query "getMessage" {
    entity "message" {
        (string)"text"
    }
    input (entity)"lookup"
    returns (entity)"message"
    context "Return null when no message matches."
}
interface "message" {
    context (query)"getMessage" "Render the returned message text."
}
screen "message" {
    use (interface)"message"
}
`;

  const result = parseSurface(source, "scoped-query.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(result.ir.queries?.[0], {
    id: "getMessage",
    entities: [{
      id: "message",
      fields: [{ name: "text", type: "string" }],
    }],
    input: { entity: "lookup" },
    returns: { entity: "message" },
  });
  assertEquals(result.ir.screens[0].interface, "message");
});

Deno.test("a query can return a private entity without an input", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "helloQuery" { purpose "Display a queried greeting." }
query "getHello" {
    entity "hello" {
        (string)"message"
    }
    returns (entity)"hello"
    context "Return null when no greeting is available."
}
interface "hello" {
    context (query)"getHello" "Render the greeting message."
}
screen "hello" {
    use (interface)"hello"
}
`;

  const result = parseSurface(source, "hello-query.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(result.ir.queries?.[0].input, undefined);
  assertEquals(result.ir.queries?.[0].returns.entity, "hello");
});

Deno.test("a query can use an optional-only input entity", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "search" { purpose "Search messages." }
query "searchMessages" {
    entity "filters" { (string)"term" optional }
    entity "result" { (string)"message" }
    input (entity)"filters"
    returns (entity)"result"
    context "Return null when no message matches."
}
interface "results" {
    context (query)"searchMessages" "Render matching messages or a no-results experience."
}
screen "results" {
    use (interface)"results"
}
`;

  const result = parseSurface(source, "optional-input.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
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

Deno.test("CLI reference lists and returns canonical checked references", () => {
  const specification = join(contactExampleRoot, "surface.kdl");
  const listed = runCli(["reference", specification, "--list"]);
  assertEquals(listed.code, 0, decoder.decode(listed.stderr));
  const references = JSON.parse(decoder.decode(listed.stdout));
  assert(
    references.some(
      ({ selector, reference }: { selector: string; reference: string }) =>
        selector === "screen.contact" && reference === '(screen)"contact"',
    ),
  );
  assert(
    references.some(
      ({ selector, reference }: { selector: string; reference: string }) =>
        selector === "interface.contactViewer" &&
        reference === '(interface)"contactViewer"',
    ),
  );
  assert(
    references.some(
      (
        { selector, reference, scope }: {
          selector: string;
          reference: string;
          scope?: string;
        },
      ) =>
        selector === "query.contactById.entity.contactLookup" &&
        reference === '(entity)"contactLookup"' &&
        scope === "query.contactById",
    ),
  );

  const selected = runCli(["reference", specification, "screen.contact"]);
  assertEquals(selected.code, 0, decoder.decode(selected.stderr));
  assertEquals(decoder.decode(selected.stdout).trim(), '(screen)"contact"');

  const privateEntity = runCli([
    "reference",
    specification,
    "query.contactById.entity.contactLookup",
  ]);
  assertEquals(privateEntity.code, 0, decoder.decode(privateEntity.stderr));
  assertEquals(
    decoder.decode(privateEntity.stdout).trim(),
    '(entity)"contactLookup"',
  );

  const unknown = runCli(["reference", specification, "screen.missing"]);
  assertEquals(unknown.code, 1);
  assertMatch(decoder.decode(unknown.stderr), /Unknown declaration selector/);
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
interface "helloWorld" {
context "Render the exact text: Hello, world!"
}
screen "home" route="/" {
use (interface)"helloWorld"
}
`;

  try {
    await Deno.writeTextFile(temporaryFile, source);
    const formatted = runCli(["format", temporaryFile]);
    assertEquals(formatted.code, 0, decoder.decode(formatted.stderr));

    const output = await Deno.readTextFile(temporaryFile);
    assertMatch(output, /\/\/ Retain me\./);
    assertMatch(output, /^[ ]{4}purpose/m);
    assertMatch(output, /^[ ]{4}context/m);
    assertMatch(output, /^[ ]{4}use/m);
  } finally {
    await Deno.remove(temporaryDirectory, { recursive: true });
  }
});

Deno.test("the implemented page matches the Surface interface intent", async () => {
  const html = await Deno.readTextFile(join(exampleRoot, "app", "index.html"));
  assertMatch(html, /<h1>My app<\/h1>/);
  assertMatch(html, /<p>Hello, world!<\/p>/);
});

Deno.test("the implemented FAQ page contains every ordered question", async () => {
  const html = await Deno.readTextFile(
    join(faqExampleRoot, "app", "index.html"),
  );
  const questions = [
    "What is Surface?",
    "Is Surface a programming language?",
    "Does every screen need a route?",
  ];
  const positions = questions.map((question) => html.indexOf(`<h2>${question}</h2>`));

  assert(positions.every((position) => position >= 0));
  assertEquals([...positions].sort((left, right) => left - right), positions);
  assertMatch(
    html,
    /Surface is a small format for describing an application\./,
  );
  assertMatch(
    html,
    /No\. Surface is a specification format rather than an executable language\./,
  );
  assertMatch(html, /Leave it out for screens that are not addressable\./);
});

Deno.test("the Contact Viewer implements selected, empty, and not-found states", () => {
  const empty = renderContactPage(null);
  assertMatch(empty, /<h1>Select a contact<\/h1>/);
  assertMatch(empty, /Choose a contact identifier/);

  const ada = renderContactPage("ada");
  assertMatch(ada, /Ada Lovelace/);
  assertMatch(ada, /ada@example\.com/);
  assertMatch(ada, /<dd>Yes<\/dd>/);

  const grace = renderContactPage("grace");
  assertMatch(grace, /Grace Hopper/);
  assertMatch(grace, /<dd>Not provided<\/dd>/);
  assertMatch(grace, /<dd>No<\/dd>/);

  const missing = renderContactPage("unknown");
  assertMatch(missing, /<h1>Contact not found<\/h1>/);
  assertMatch(missing, /No contact exists for the selected identifier/);
});

Deno.test("the Contact Viewer redirects its root URL to its declared route", async () => {
  const root = handleContactRequest(new Request("http://localhost:8000/"));
  assertEquals(root.status, 302);
  assertEquals(root.headers.get("location"), "http://localhost:8000/contacts");

  const contacts = handleContactRequest(
    new Request("http://localhost:8000/contacts?id=ada"),
  );
  assertEquals(contacts.status, 200);
  assertMatch(await contacts.text(), /Ada Lovelace/);

  const unknown = handleContactRequest(
    new Request("http://localhost:8000/unknown"),
  );
  assertEquals(unknown.status, 404);
});

Deno.test("the skill defines all three required forward evaluations", async () => {
  const evaluations = JSON.parse(
    await Deno.readTextFile(join(repositoryRoot, "test", "skill-evaluations.json")),
  );

  assertEquals(evaluations.rung, 3);
  assertEquals(
    evaluations.cases.map(({ id }: { id: string }) => id),
    ["create", "modify", "diagnose"],
  );
  assert(
    evaluations.cases.every(
      ({ acceptance }: { acceptance: string[] }) => acceptance.length > 0,
    ),
  );

  const skill = await Deno.readTextFile(
    join(repositoryRoot, "skills", "surface", "SKILL.md"),
  );
  const metadata = await Deno.readTextFile(
    join(repositoryRoot, "skills", "surface", "agents", "openai.yaml"),
  );
  assertMatch(skill, /^---\nname: surface\ndescription: .+\n---/);
  assertMatch(skill, /surface "0\.1"/);
  assertMatch(skill, /entity "contact"/);
  assertMatch(skill, /\(string\)"id"/);
  assertMatch(skill, /entity "contactLookup"/);
  assertMatch(skill, /input \(entity\)"contactLookup"/);
  assertMatch(skill, /returns \(entity\)"contact"/);
  assertMatch(skill, /If there is no contact, return null\./);
  assertMatch(skill, /interface "contactViewer"/);
  assertMatch(skill, /use \(interface\)"contactViewer"/);
  assertMatch(skill, /screen "home" route="\/"/);
  assertMatch(
    skill,
    /context \(screen\)"contact" "Redirect to this screen\."/,
  );
  assertMatch(metadata, /default_prompt: "Use \$surface /);
});

Deno.test("the repository contains no JavaScript source files", async () => {
  const files = await collectFiles(repositoryRoot);
  const javascript = files
    .filter((file) => file.endsWith(".js"))
    .map((file) => file.slice(repositoryRoot.length + 1));

  assertEquals(javascript, []);
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

async function collectFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    const path = join(directory, entry.name);
    if (entry.isDirectory) {
      files.push(...await collectFiles(path));
    } else if (entry.isFile) {
      files.push(path);
    }
  }
  return files.sort();
}
