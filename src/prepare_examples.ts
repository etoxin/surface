import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examplesRoot = join(repositoryRoot, "examples");
const surfaceSkillRoot = join(repositoryRoot, "skills", "surface");
const buildSkillRoot = join(repositoryRoot, "skills", "surf-build");

const exampleNames = [
  "hello-world",
  "todo-list",
  "online-checkout",
  "multi-tenant-project-tracker",
];

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

for (const name of exampleNames) {
  const exampleRoot = join(examplesRoot, name);
  const codexSurfaceSkill = join(exampleRoot, ".agents", "skills", "surface");
  const codexBuildSkill = join(exampleRoot, ".agents", "skills", "surf-build");
  const claudeSurfaceSkill = join(exampleRoot, ".claude", "skills", "surface");
  const claudeBuildCommand = join(
    exampleRoot,
    ".claude",
    "commands",
    "surf:build.md",
  );

  await Deno.stat(join(exampleRoot, "surface.kdl"));
  await copyDirectory(surfaceSkillRoot, codexSurfaceSkill);
  await copyDirectory(buildSkillRoot, codexBuildSkill);
  await copyDirectory(surfaceSkillRoot, claudeSurfaceSkill);
  await Deno.mkdir(dirname(claudeBuildCommand), { recursive: true });
  await Deno.copyFile(join(buildSkillRoot, "SKILL.md"), claudeBuildCommand);

  console.log(`Prepared agent commands in examples/${name}`);
}
