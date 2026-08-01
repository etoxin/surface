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
import { handleFaqRequest } from "../examples/02-static-faq/app/server.ts";
import {
  handleCounterRequest,
  parseCounterValue,
  renderCounterPage,
} from "../examples/04-click-counter/app/server.ts";
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
const counterExampleRoot = join(
  repositoryRoot,
  "examples",
  "04-click-counter",
);
const todoExampleRoot = join(
  repositoryRoot,
  "examples",
  "05-todo-list",
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

Deno.test("the Click Counter specification exports the reviewed IR", async () => {
  const source = await Deno.readTextFile(join(counterExampleRoot, "surface.kdl"));
  const expected = JSON.parse(
    await Deno.readTextFile(join(counterExampleRoot, "expected-ir.json")),
  );

  const result = parseSurface(source, "surface.kdl");

  assertEquals(result.diagnostics, []);
  assertEquals(result.ir, expected);
  assertEquals(formatSurface(source, "surface.kdl").output, source);
});

Deno.test("the Todo List specification exports the reviewed IR", async () => {
  const source = await Deno.readTextFile(join(todoExampleRoot, "surface.kdl"));
  const expected = JSON.parse(
    await Deno.readTextFile(join(todoExampleRoot, "expected-ir.json")),
  );

  const result = parseSurface(source, "surface.kdl");

  assertEquals(result.diagnostics, []);
  assertEquals(result.ir, expected);
  assertEquals(formatSurface(source, "surface.kdl").output, source);
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

Deno.test(
  "the Click Counter invalid fixtures report their expected diagnostics",
  async () => {
    const invalidRoot = join(counterExampleRoot, "invalid");
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
  "the Todo List invalid fixtures report their expected diagnostics",
  async () => {
    const invalidRoot = join(todoExampleRoot, "invalid");
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

screen "home" {
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
screen "first" { use (interface)"first" }
screen "second" { use (interface)"second" }
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

Deno.test("a screen does not need URL logic", () => {
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

Deno.test("the legacy screen route property is rejected", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "legacyRoute" { purpose "Reject the route property." }
screen "home" route="/" { context "Render home." }
`;

  const result = parseSurface(source, "legacy-route.kdl");
  assert(result.diagnostics.some(({ code }) => code === "SURF-PROP-003"));
  assertEquals(result.ir, null);
});

Deno.test("a logic-only screen can describe non-visual navigation", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "navigation" { purpose "Describe application navigation." }
screen "home" {
    logic {
        "Use / as this screen's URL path."
        (screen)"contact" "Open this screen."
    }
}
interface "contact" { context "Render contact details." }
screen "contact" {
    use (interface)"contact"
    logic { "Use /contacts as this screen's URL path." }
}
`;

  const result = parseSurface(source, "logic-only-screen.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(result.ir.screens[0], {
    id: "home",
    logic: [
      { instruction: "Use / as this screen's URL path." },
      {
        instruction: "Open this screen.",
        reference: { type: "screen", id: "contact" },
      },
    ],
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
collection "contact" { (string)"id" }
function "getContact" {
    collection "lookup" { (string)"id" }
    context (collection)"lookup" (collection)"contact" (interface)"contact" (screen)"contact" "Use these declarations together."
    output (collection)"contact"
}
screen "home" {
    context (function)"getContact" (interface)"contact" (screen)"contact" "Delegate to these declarations."
}
interface "contact" { context "Render contact details." }
screen "contact" {
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

Deno.test("values and enum fields use checked value references", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "valueExample" { purpose "Exercise value declarations." }
(number)value "defaultPriority" 1
(array)value "todos" variable
(enum)value "todoStatus" {
    context "The complete task lifecycle."
    "open"
    "completed" {
        context "The task has been completed."
    }
    "archived"
}
collection "todo" {
    (enum)"status" (value)"todoStatus" optional
}
interface "todos" {
    context (value)"todoStatus" (value)"todos" (collection)"todo" "Render todos by status."
}
screen "home" { use (interface)"todos" }
`;

  const result = parseSurface(source, "values.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(result.ir.values, [
    { id: "defaultPriority", type: "number", kind: "constant", initial: 1 },
    { id: "todos", type: "array", kind: "variable" },
    {
      id: "todoStatus",
      type: "enum",
      kind: "constant",
      values: ["open", "completed", "archived"],
    },
  ]);
  assertEquals(result.ir.collections?.[0].fields, [{
    name: "status",
    type: "enum",
    value: "todoStatus",
    optional: true,
  }]);

  const unresolved = parseSurface(
    `/- kdl-version 2
surface "0.1"
application "badEnum" { purpose "Reject a missing enum value." }
collection "todo" { (enum)"status" (value)"missingStatus" }
screen "home" { context "Render todos." }
`,
    "unresolved-enum-value.kdl",
  );
  assert(unresolved.diagnostics.some(({ code }) => code === "SURF-REF-001"));

  const invalid = parseSurface(
    `/- kdl-version 2
surface "0.1"
application "badEnum" { purpose "Reject malformed enums." }
(enum)value "empty" {}
(enum)value "duplicate" {
    "same"
    "same"
}
collection "todo" { (boolean)"status" (value)"duplicate" }
screen "home" { context "Render todos." }
`,
    "invalid-enum.kdl",
  );
  assert(invalid.diagnostics.some(({ code }) => code === "SURF-CHILD-003"));
  assert(invalid.diagnostics.some(({ code }) => code === "SURF-ID-002"));
  assert(invalid.diagnostics.some(({ code }) => code === "SURF-TYPE-001"));
});

Deno.test("collections accept the complete portable type set", () => {
  const types = [
    "any",
    "array",
    "bigint",
    "boolean",
    "bytes",
    "char",
    "date",
    "dateTime",
    "decimal",
    "duration",
    "enum",
    "float32",
    "float64",
    "int8",
    "int16",
    "int32",
    "int64",
    "integer",
    "json",
    "map",
    "number",
    "object",
    "regex",
    "set",
    "string",
    "time",
    "tuple",
    "uint8",
    "uint16",
    "uint32",
    "uint64",
    "unknown",
    "url",
    "uuid",
  ];
  const fields = types.map((type, index) =>
    type === "enum"
      ? `    (enum)"field${index}" (value)"options"`
      : `    (${type})"field${index}"`
  )
    .join("\n");
  const result = parseSurface(
    `/- kdl-version 2
surface "0.1"
application "portableTypes" { purpose "Exercise portable types." }
(enum)value "options" { "one" }
collection "portable" {
${fields}
}
screen "home" { context "Render the portable values." }
`,
    "portable-types.kdl",
  );

  assertEquals(result.diagnostics, []);
  assertEquals(result.ir?.collections?.[0].fields.map(({ type }) => type), types);
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
collection "contact" {
    context "Collection guidance."
    (string)"id" {
        context "Field guidance."
    }
}
function "contactById" {
    context "Function guidance."
    collection "contactLookup" {
        context "Private collection guidance."
        (string)"id" {
            context "Private field guidance."
        }
    }
    input (collection)"contactLookup" {
        context "Input guidance."
    }
    output (collection)"contact" {
        context "Output guidance."
    }
    context "Produce null when no contact matches."
}
interface "contact" {
    context (function)"contactById" (collection)"contact" "Interface guidance."
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

Deno.test("function collection references resolve private and global scopes", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "scopedFunction" { purpose "Exercise scoped collections." }
collection "lookup" {
    (string)"id"
}
function "getMessage" {
    collection "message" {
        (string)"text"
    }
    input (collection)"lookup"
    output (collection)"message"
    context "Produce null when no message matches."
}
interface "message" {
    context (function)"getMessage" "Render the returned message text."
}
screen "message" {
    use (interface)"message"
}
`;

  const result = parseSurface(source, "scoped-function.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(result.ir.functions?.[0], {
    id: "getMessage",
    collections: [{
      id: "message",
      fields: [{ name: "text", type: "string" }],
    }],
    input: { collection: "lookup" },
    output: { collection: "message" },
  });
  assertEquals(result.ir.screens[0].interface, "message");
});

Deno.test("a function can output a private collection without an input", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "helloFunction" { purpose "Display a returned greeting." }
function "getHello" {
    collection "hello" {
        (string)"message"
    }
    output (collection)"hello"
    context "Produce null when no greeting is available."
}
interface "hello" {
    context (function)"getHello" "Render the greeting message."
}
screen "hello" {
    use (interface)"hello"
}
`;

  const result = parseSurface(source, "hello-function.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(result.ir.functions?.[0].input, undefined);
  assertEquals(result.ir.functions?.[0].output.collection, "hello");
});

Deno.test("a function can use an optional-only input collection", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "search" { purpose "Search messages." }
function "searchMessages" {
    collection "filters" { (string)"term" optional }
    collection "result" { (string)"message" }
    input (collection)"filters"
    output (collection)"result"
    context "Produce null when no message matches."
}
interface "results" {
    context (function)"searchMessages" "Render matching messages or a no-results experience."
}
screen "results" {
    use (interface)"results"
}
`;

  const result = parseSurface(source, "optional-input.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
});

Deno.test("logic preserves ordered strings and checked references", () => {
  const source = `/- kdl-version 2

surface "0.1"
application "logicExample" { purpose "Exercise logic." }
collection "contact" { (string)"name" }
function "loadContacts" {
    output (collection)"contact"
    logic {
        "Send an HTTP GET request."
        (collection)"contact" "If the response succeeds, decode it into this collection."
        "If the response fails, output an error."
    }
}
interface "contactList" {
    logic {
        (function)"loadContacts" "When the interface opens, invoke this function."
    }
}
screen "home" {
    use (interface)"contactList"
    logic {
        "If access is denied, show an error."
    }
}
`;

  const result = parseSurface(source, "logic.kdl");
  assertEquals(result.diagnostics, []);
  assert(result.ir !== null);
  assertEquals(result.ir.functions?.[0].logic, [
    { instruction: "Send an HTTP GET request." },
    {
      instruction: "If the response succeeds, decode it into this collection.",
      reference: { type: "collection", id: "contact" },
    },
    { instruction: "If the response fails, output an error." },
  ]);
  assertEquals(result.ir.interfaces?.[0].logic, [{
    instruction: "When the interface opens, invoke this function.",
    reference: { type: "function", id: "loadContacts" },
  }]);
  assertEquals(result.ir.screens[0].logic, [{
    instruction: "If access is denied, show an error.",
  }]);
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

Deno.test("CLI reference lists and resolves canonical checked references", () => {
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

  const todoSpecification = join(todoExampleRoot, "surface.kdl");
  const todoListed = runCli(["reference", todoSpecification, "--list"]);
  assertEquals(todoListed.code, 0, decoder.decode(todoListed.stderr));
  assert(
    JSON.parse(decoder.decode(todoListed.stdout)).some(
      ({ selector, reference }: { selector: string; reference: string }) =>
        selector === "value.todoStatus" &&
        reference === '(value)"todoStatus"',
    ),
  );
  const selectedValue = runCli([
    "reference",
    todoSpecification,
    "value.todoStatus",
  ]);
  assertEquals(selectedValue.code, 0, decoder.decode(selectedValue.stderr));
  assertEquals(
    decoder.decode(selectedValue.stdout).trim(),
    '(value)"todoStatus"',
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
      ({ selector, reference }: { selector: string; reference: string }) =>
        selector === "collection.contact" &&
        reference === '(collection)"contact"',
    ),
  );
  assert(
    references.some(
      ({ selector, reference }: { selector: string; reference: string }) =>
        selector === "function.contactById" &&
        reference === '(function)"contactById"',
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
        selector === "function.contactById.collection.contactLookup" &&
        reference === '(collection)"contactLookup"' &&
        scope === "function.contactById",
    ),
  );

  const selected = runCli(["reference", specification, "screen.contact"]);
  assertEquals(selected.code, 0, decoder.decode(selected.stderr));
  assertEquals(decoder.decode(selected.stdout).trim(), '(screen)"contact"');

  const selectedFunction = runCli([
    "reference",
    specification,
    "function.contactById",
  ]);
  assertEquals(selectedFunction.code, 0, decoder.decode(selectedFunction.stderr));
  assertEquals(
    decoder.decode(selectedFunction.stdout).trim(),
    '(function)"contactById"',
  );

  const privateCollection = runCli([
    "reference",
    specification,
    "function.contactById.collection.contactLookup",
  ]);
  assertEquals(privateCollection.code, 0, decoder.decode(privateCollection.stderr));
  assertEquals(
    decoder.decode(privateCollection.stdout).trim(),
    '(collection)"contactLookup"',
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
screen "home" {
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
    "How does a screen get a URL?",
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
  assertMatch(html, /Describe the URL path in the screen's logic\./);
  assertMatch(html, /class="skip-link"/);
  assertMatch(html, /aria-labelledby="faq-title"/);
  assertEquals([...html.matchAll(/class="faq-card"/g)].length, 3);

  const faq = handleFaqRequest(
    new Request("http://localhost:8002/faq"),
    html,
  );
  assertEquals(faq.status, 200);
  assertMatch(await faq.text(), /<h1 id="faq-title">Frequently asked questions<\/h1>/);

  const unknown = handleFaqRequest(
    new Request("http://localhost:8002/unknown"),
    html,
  );
  assertEquals(unknown.status, 404);
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

Deno.test("the Contact Viewer follows its screen navigation logic", async () => {
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

Deno.test("the Click Counter implements its initial, increment, and reset states", async () => {
  assertEquals(parseCounterValue(null), 0);
  assertEquals(parseCounterValue("4"), 4);
  assertEquals(parseCounterValue("-1"), 0);
  assertEquals(parseCounterValue("4x"), 0);
  assertEquals(parseCounterValue("9007199254740992"), 0);

  const initial = renderCounterPage(0);
  assertMatch(initial, /aria-label="Current count">0<\/output>/);
  assertMatch(initial, /name="count" value="1">Increment<\/button>/);
  assertMatch(initial, /name="count" value="0">Reset<\/button>/);

  const incremented = await handleCounterRequest(
    new Request("http://localhost:8001/?count=4"),
  ).text();
  assertMatch(incremented, /aria-label="Current count">4<\/output>/);
  assertMatch(incremented, /name="count" value="5">Increment<\/button>/);

  const reset = await handleCounterRequest(
    new Request("http://localhost:8001/?count=0"),
  ).text();
  assertMatch(reset, /aria-label="Current count">0<\/output>/);

  const unknown = handleCounterRequest(
    new Request("http://localhost:8001/unknown"),
  );
  assertEquals(unknown.status, 404);
});

Deno.test("the Todo List is a self-contained interactive HTML app", async () => {
  const html = await Deno.readTextFile(
    join(todoExampleRoot, "app", "index.html"),
  );

  assertMatch(html, /<!doctype html>/);
  assertMatch(html, /const statuses = \["open", "completed", "archived"\]/);
  assertMatch(html, /const createTodo =/);
  assertMatch(html, /const completeTodo =/);
  assertMatch(html, /const reopenTodo =/);
  assertMatch(html, /const archiveTodo =/);
  assertMatch(html, /value === "" \? null/);
  assertMatch(html, /name="dueDate" type="date"/);
  assertMatch(html, /name="priority" type="number"/);
  assertMatch(html, /tags\.value\.split\(","\)/);
  assertMatch(html, /priority: priority === "" \? 1 : Number\(priority\)/);
  assertMatch(html, /Enter a task before adding it\./);
  assertMatch(html, /id="open-count" aria-label="0 open"/);
  assertMatch(html, /id="completed-count" aria-label="0 completed"/);
  assertMatch(html, /id="archived-count" aria-label="0 archived"/);
  assertMatch(html, /todos\.map/);
  assertMatch(html, /text\.textContent = todo\.text/);
});

Deno.test("the skill defines all three required forward evaluations", async () => {
  const evaluations = JSON.parse(
    await Deno.readTextFile(join(repositoryRoot, "test", "skill-evaluations.json")),
  );

  assertEquals(evaluations.rung, 5);
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
  assertMatch(skill, /collection "contact"/);
  assertMatch(skill, /\(string\)"id"/);
  assertMatch(skill, /collection "contactLookup"/);
  assertMatch(skill, /function "contactById"/);
  assertMatch(skill, /input \(collection\)"contactLookup"/);
  assertMatch(skill, /output \(collection\)"contact"/);
  assertMatch(skill, /logic \{/);
  assertMatch(
    skill,
    /\(collection\)"contact" "If a matching contact exists, output it\."/,
  );
  assert(!/\b(?:entity|returns)\b/.test(skill));
  assertMatch(skill, /If no contact matches, output null\./);
  assertMatch(skill, /interface "contactViewer"/);
  assertMatch(skill, /use \(interface\)"contactViewer"/);
  assertMatch(skill, /interface "clickCounter"/);
  assertMatch(skill, /When Increment is activated, increase the current value by 1/);
  assertMatch(skill, /When Reset is activated, set the current value to 0/);
  assertMatch(skill, /interface "todoList"/);
  assertMatch(skill, /\(number\)value "defaultPriority" 1/);
  assertMatch(skill, /\(array\)value "todos" variable/);
  assertMatch(skill, /\(enum\)value "todoStatus"/);
  assertMatch(skill, /\(enum\)"status" \(value\)"todoStatus"/);
  assertMatch(skill, /\(date\)"dueDate" optional/);
  assertMatch(skill, /\(number\)"priority"/);
  assertMatch(skill, /\(array\)"tags" optional/);
  assertMatch(skill, /collection "todo"/);
  assertMatch(skill, /function "createTodo"/);
  assertMatch(skill, /function "completeTodo"/);
  assertMatch(skill, /function "reopenTodo"/);
  assertMatch(skill, /function "archiveTodo"/);
  assertMatch(skill, /When Complete is activated/);
  assertMatch(skill, /display each task in exactly one group/);
  assertMatch(skill, /"Use \/ as this screen's URL path\."/);
  assertMatch(
    skill,
    /\(screen\)"contact" "Open this screen\."/,
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
