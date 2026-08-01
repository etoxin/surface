import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { installAgentSupport } from "./init.ts";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examplesRoot = join(repositoryRoot, "examples");

const exampleNames = [
  "hello-world",
  "todo-list",
  "online-checkout",
  "multi-tenant-project-tracker",
];

for (const name of exampleNames) {
  const exampleRoot = join(examplesRoot, name);

  await Deno.stat(join(exampleRoot, "surface.kdl"));
  await installAgentSupport(exampleRoot, ["codex", "claude"]);

  console.log(`Prepared agent commands in examples/${name}`);
}
