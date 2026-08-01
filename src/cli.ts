#!/usr/bin/env -S deno run --allow-read --allow-write

import { resolve } from "node:path";

import { type Document, format, type Node } from "@bgotink/kdl";

import { type Diagnostic, formatDiagnostic } from "./diagnostics.ts";
import { formatSurface } from "./formatter.ts";
import {
  type Agent,
  ensureBuildIgnored,
  installAgentSupport,
  selectAgents,
} from "./init.ts";
import { parseKdl, parseSurface } from "./surface.ts";

interface SurfaceReference {
  selector: string;
  reference: string;
  scope?: string;
  declaration: Node;
}

export async function main(args: string[]): Promise<number> {
  const [command, ...arguments_] = args;

  if (!command || command === "help" || command === "--help") {
    printHelp();
    return command ? 0 : 1;
  }

  if (command === "init") {
    return await runInit(arguments_);
  }

  const fileArgument = arguments_[0];
  if (!fileArgument) {
    console.error(`Missing file for surf ${command}.`);
    printHelp();
    return 1;
  }

  const file = resolve(fileArgument);
  const source = await Deno.readTextFile(file);

  switch (command) {
    case "parse":
      return runParse(source, fileArgument);
    case "check":
      return runCheck(source, fileArgument);
    case "format":
      return await runFormat(source, file, fileArgument);
    case "export":
      return runExport(source, fileArgument, arguments_.slice(1));
    case "reference":
      return runReference(source, fileArgument, arguments_.slice(1));
    default:
      console.error(`Unknown command ${command}.`);
      printHelp();
      return 1;
  }
}

async function runInit(args: string[]): Promise<number> {
  if (args.includes("--help")) {
    printInitHelp();
    return 0;
  }

  const unknown = args.find((argument) =>
    argument !== "--codex" && argument !== "--claude"
  );
  if (unknown !== undefined) {
    console.error(`Unknown init option ${unknown}.`);
    printInitHelp();
    return 1;
  }

  let agents: Agent[] = [];
  if (args.includes("--codex")) {
    agents.push("codex");
  }
  if (args.includes("--claude")) {
    agents.push("claude");
  }
  if (agents.length === 0) {
    agents = await selectAgents();
  }

  const projectRoot = Deno.cwd();
  const installed = await installAgentSupport(projectRoot, agents);
  const updatedIgnore = await ensureBuildIgnored(projectRoot);
  const labels = agents.map((agent) => agent === "codex" ? "Codex" : "Claude Code");

  console.log(`Initialized Surface for ${labels.join(" and ")}.`);
  console.log(`Installed ${installed.length} agent files.`);
  if (updatedIgnore) {
    console.log("Added /build/ to .gitignore.");
  }
  console.log("Build surface.kdl with:");
  if (agents.includes("codex")) {
    console.log("  Codex: $surf-build");
  }
  if (agents.includes("claude")) {
    console.log("  Claude Code: /surf:build");
  }

  return 0;
}

function runParse(source: string, file: string): number {
  const result = parseKdl(source, file);
  if (printDiagnostics(result.diagnostics)) {
    return 1;
  }
  if (result.document === null) {
    console.error(`Could not parse ${file}.`);
    return 1;
  }

  console.log(`Parsed ${file}: ${result.document.nodes.length} top-level nodes.`);
  return 0;
}

function runCheck(source: string, file: string): number {
  const result = parseSurface(source, file);
  if (printDiagnostics(result.diagnostics)) {
    return 1;
  }

  console.log(`OK ${file}`);
  return 0;
}

async function runFormat(
  source: string,
  absoluteFile: string,
  displayFile: string,
): Promise<number> {
  const checked = parseSurface(source, displayFile);
  if (printDiagnostics(checked.diagnostics)) {
    return 1;
  }

  const result = formatSurface(source, displayFile);
  if (printDiagnostics(result.diagnostics)) {
    return 1;
  }
  if (result.output === null) {
    console.error(`Could not format ${displayFile}.`);
    return 1;
  }

  await Deno.writeTextFile(absoluteFile, result.output);
  console.log(`Formatted ${displayFile}`);
  return 0;
}

function runExport(source: string, file: string, args: string[]): number {
  const formatIndex = args.indexOf("--format");
  const requestedFormat = formatIndex === -1 ? "json" : args[formatIndex + 1];
  if (requestedFormat !== "json") {
    console.error(`Unsupported export format ${requestedFormat ?? "(missing)"}.`);
    return 1;
  }

  const result = parseSurface(source, file);
  if (printDiagnostics(result.diagnostics)) {
    return 1;
  }

  console.log(JSON.stringify(result.ir, null, 2));
  return 0;
}

function runReference(source: string, file: string, args: string[]): number {
  const result = parseSurface(source, file);
  if (printDiagnostics(result.diagnostics)) {
    return 1;
  }
  if (result.ir === null || result.document === null) {
    console.error(`Could not read Surface references from ${file}.`);
    return 1;
  }

  const references = collectReferences(result.document);
  const selector = args[0];
  if (args.length !== 1 || selector === undefined) {
    console.error(
      `Usage: surf reference <file.kdl> <selector|--list>`,
    );
    return 1;
  }
  if (selector === "--list") {
    console.log(JSON.stringify(references.map(referenceListing), null, 2));
    return 0;
  }

  const match = references.find((reference) => reference.selector === selector);
  if (match === undefined) {
    console.error(
      `Unknown declaration selector ${selector}. Run surf reference ${file} --list to see available references.`,
    );
    return 1;
  }

  console.log(formatDeclaration(match.declaration));
  return 0;
}

function collectReferences(document: Document): SurfaceReference[] {
  const references: SurfaceReference[] = [];

  for (const node of document.nodes) {
    const type = node.getName();
    const id = node.getArgument(0);
    if (
      typeof id !== "string" ||
      !["application", "collection", "function", "interface", "screen", "value"]
        .includes(type)
    ) {
      continue;
    }

    const selector = `${type}.${id}`;
    references.push({
      selector,
      reference: `(${type})"${id}"`,
      declaration: node,
    });

    if (type !== "function") {
      continue;
    }

    for (const child of node.children?.nodes ?? []) {
      const childId = child.getArgument(0);
      if (child.getName() !== "collection" || typeof childId !== "string") {
        continue;
      }
      references.push({
        selector: `${selector}.collection.${childId}`,
        reference: `(collection)"${childId}"`,
        scope: selector,
        declaration: child,
      });
    }
  }

  return references;
}

function referenceListing(
  reference: SurfaceReference,
): Omit<SurfaceReference, "declaration"> {
  return {
    selector: reference.selector,
    reference: reference.reference,
    ...(reference.scope === undefined ? {} : { scope: reference.scope }),
  };
}

function formatDeclaration(node: Node): string {
  const lines = format(node).replaceAll("\r\n", "\n").split("\n");
  while (lines[0]?.trim() === "") {
    lines.shift();
  }
  while (lines.at(-1)?.trim() === "") {
    lines.pop();
  }

  const indentation = Math.min(
    ...lines
      .filter((line) => line.trim() !== "")
      .map((line) => line.match(/^[ \t]*/u)?.[0].length ?? 0),
  );

  return lines.map((line) => line.slice(indentation)).join("\n");
}

function printDiagnostics(diagnostics: Diagnostic[]): boolean {
  if (diagnostics.length === 0) {
    return false;
  }

  console.error(diagnostics.map(formatDiagnostic).join("\n\n"));
  return diagnostics.some(({ severity }) => severity === "error");
}

function printHelp(): void {
  console.log(`Usage:
  surf init [--codex] [--claude]
  surf parse <file.kdl>
  surf check <file.kdl>
  surf format <file.kdl>
  surf export <file.kdl> --format json
  surf reference <file.kdl> <selector|--list>`);
}

function printInitHelp(): void {
  console.log(`Usage:
  surf init
  surf init --codex
  surf init --claude
  surf init --codex --claude

Without flags, init opens an interactive multi-select.`);
}

if (import.meta.main) {
  try {
    Deno.exit(await main(Deno.args));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
