import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examplesRoot = join(repositoryRoot, "examples");
const skillRoot = join(repositoryRoot, "skills", "surface");

const exampleNames = [
  "hello-world",
  "todo-list",
  "online-checkout",
  "multi-tenant-project-tracker",
] as const;

type ExampleName = (typeof exampleNames)[number];

function isExampleName(value: string): value is ExampleName {
  return exampleNames.some((name) => name === value);
}

async function removeIfPresent(path: string): Promise<void> {
  try {
    await Deno.remove(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}

async function copyDirectory(source: string, destination: string): Promise<void> {
  await Deno.mkdir(destination, { recursive: true });

  for await (const entry of Deno.readDir(source)) {
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);

    if (entry.isDirectory) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile) {
      await Deno.copyFile(sourcePath, destinationPath);
    } else {
      throw new Error(`Cannot copy unsupported skill entry: ${sourcePath}`);
    }
  }
}

async function installSkills(): Promise<void> {
  for (const name of exampleNames) {
    const exampleRoot = join(examplesRoot, name);
    const destination = join(exampleRoot, ".agents", "skills", "surface");

    await Deno.stat(join(exampleRoot, "surface.kdl"));
    await removeIfPresent(destination);
    await copyDirectory(skillRoot, destination);

    console.log(`Installed Surface skill in examples/${name}/.agents/skills/surface`);
  }
}

async function cleanExample(name: string | undefined): Promise<void> {
  if (!name || !isExampleName(name)) {
    console.error(
      `Choose one example to clean: ${exampleNames.join(", ")}`,
    );
    Deno.exitCode = 1;
    return;
  }

  const exampleRoot = join(examplesRoot, name);
  const appRoot = join(exampleRoot, "app");

  if (basename(appRoot) !== "app" || dirname(appRoot) !== exampleRoot) {
    throw new Error(`Refusing to clean unexpected path: ${appRoot}`);
  }

  await Deno.stat(join(exampleRoot, "surface.kdl"));
  await removeIfPresent(appRoot);
  await Deno.mkdir(appRoot);

  console.log(`Cleared examples/${name}/app`);
  console.log("Preserved surface.kdl, README.md, and .agents/skills.");
}

function printUsage(): void {
  console.log(`Usage:
  deno task examples-prepare
  deno task example-clean <example>

Examples:
  ${exampleNames.join("\n  ")}`);
}

if (import.meta.main) {
  const [command, argument, ...extraArguments] = Deno.args;

  if (extraArguments.length > 0) {
    printUsage();
    Deno.exitCode = 1;
  } else if (command === "install-skills" && argument === undefined) {
    await installSkills();
  } else if (command === "clean") {
    await cleanExample(argument);
  } else {
    printUsage();
    Deno.exitCode = 1;
  }
}
