import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const executable = Deno.build.os === "windows" ? "surf.exe" : "surf";
const output = join("build", executable);

await Deno.mkdir(join(repositoryRoot, "build"), { recursive: true });

const command = new Deno.Command(Deno.execPath(), {
  args: [
    "compile",
    "--allow-read",
    "--allow-write",
    "--exclude-unused-npm",
    "--output",
    output,
    "src/cli.ts",
  ],
  cwd: repositoryRoot,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});
const status = await command.spawn().status;

if (!status.success) {
  Deno.exit(status.code);
}

console.log(`Built ${output}`);
