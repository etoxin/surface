import { dirname, join, relative } from "node:path";

export type Agent = "codex" | "claude";

interface SkillFile {
  source: URL;
  destination: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const surfaceSkillFiles = [
  "SKILL.md",
  join("agents", "openai.yaml"),
];

const buildSkillFiles = [
  "SKILL.md",
  join("agents", "openai.yaml"),
];

export async function installAgentSupport(
  projectRoot: string,
  agents: Agent[],
): Promise<string[]> {
  const files = skillFilesFor(agents);
  const contents = await Promise.all(
    files.map(({ source }) => Deno.readTextFile(source)),
  );
  const installed: string[] = [];

  for (const [index, file] of files.entries()) {
    const destination = join(projectRoot, file.destination);
    await Deno.mkdir(dirname(destination), { recursive: true });
    await Deno.writeTextFile(destination, contents[index]);
    installed.push(relative(projectRoot, destination));
  }

  return installed;
}

export async function ensureBuildIgnored(projectRoot: string): Promise<boolean> {
  const ignoreFile = join(projectRoot, ".gitignore");
  let source = "";

  try {
    source = await Deno.readTextFile(ignoreFile);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  const alreadyIgnored = source.split(/\r?\n/u).some((line) => {
    const entry = line.trim();
    return entry === "build/" || entry === "/build/";
  });
  if (alreadyIgnored) {
    return false;
  }

  const separator = source.length > 0 && !source.endsWith("\n") ? "\n" : "";
  await Deno.writeTextFile(ignoreFile, `${source}${separator}/build/\n`);
  return true;
}

export async function selectAgents(): Promise<Agent[]> {
  if (!Deno.stdin.isTerminal() || !Deno.stdout.isTerminal()) {
    throw new Error(
      "Interactive init requires a terminal. Use --codex and/or --claude.",
    );
  }

  const options: Array<{ id: Agent; label: string; selected: boolean }> = [
    { id: "codex", label: "Codex", selected: true },
    { id: "claude", label: "Claude Code", selected: true },
  ];
  let cursor = 0;
  let rendered = false;

  const render = async (): Promise<void> => {
    const lines = [
      "Select the agents to configure:",
      ...options.map((option, index) => {
        const pointer = index === cursor ? ">" : " ";
        const selected = option.selected ? "x" : " ";
        return `${pointer} [${selected}] ${option.label}`;
      }),
      "Use ↑/↓ to move, Space to toggle, and Enter to continue.",
    ];
    const moveUp = rendered ? `\x1b[${lines.length}A` : "";
    const output = lines
      .map((line) => `\r\x1b[2K${line}\n`)
      .join("");
    await Deno.stdout.write(encoder.encode(`${moveUp}${output}`));
    rendered = true;
  };

  Deno.stdin.setRaw(true);
  await Deno.stdout.write(encoder.encode("\x1b[?25l"));

  try {
    await render();
    const inputBuffer = new Uint8Array(16);

    while (true) {
      const count = await Deno.stdin.read(inputBuffer);
      if (count === null) {
        throw new Error("Input closed before an agent was selected.");
      }

      const bytes = inputBuffer.subarray(0, count);
      const input = decoder.decode(bytes);
      if (bytes.includes(3)) {
        throw new Error("Initialization cancelled.");
      }
      if (input.includes("\x1b[A") || input === "k") {
        cursor = (cursor + options.length - 1) % options.length;
      } else if (input.includes("\x1b[B") || input === "j") {
        cursor = (cursor + 1) % options.length;
      } else if (input.includes(" ")) {
        options[cursor].selected = !options[cursor].selected;
      } else if (input.includes("\r") || input.includes("\n")) {
        const selected = options.filter((option) => option.selected);
        if (selected.length > 0) {
          return selected.map((option) => option.id);
        }
        await Deno.stdout.write(encoder.encode("\x07"));
      }

      await render();
    }
  } finally {
    Deno.stdin.setRaw(false);
    await Deno.stdout.write(encoder.encode("\x1b[?25h"));
  }
}

function skillFilesFor(agents: Agent[]): SkillFile[] {
  const files: SkillFile[] = [];
  const selected = new Set(agents);

  if (selected.has("codex")) {
    files.push(
      ...surfaceSkillFiles.map((file) => ({
        source: skillSource("surface", file),
        destination: join(".agents", "skills", "surface", file),
      })),
      ...buildSkillFiles.map((file) => ({
        source: skillSource("surf-build", file),
        destination: join(".agents", "skills", "surf-build", file),
      })),
    );
  }

  if (selected.has("claude")) {
    files.push(
      ...surfaceSkillFiles.map((file) => ({
        source: skillSource("surface", file),
        destination: join(".claude", "skills", "surface", file),
      })),
      {
        source: skillSource("surf-build", "SKILL.md"),
        destination: join(".claude", "commands", "surf:build.md"),
      },
    );
  }

  return files;
}

function skillSource(skill: string, file: string): URL {
  return new URL(`../skills/${skill}/${file.replaceAll("\\", "/")}`, import.meta.url);
}
