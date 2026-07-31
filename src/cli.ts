#!/usr/bin/env -S deno run --allow-read --allow-write

import { resolve } from "node:path";

import { formatDiagnostic } from "./diagnostics.js";
import { formatSurface } from "./formatter.js";
import { parseKdl, parseSurface } from "./surface.js";

interface Diagnostic {
  severity: string;
  code: string;
  message: string;
  file: string;
  line: number;
  column: number;
  declaration?: string;
  suggestion?: string;
}

export async function main(args: string[]): Promise<number> {
  const [command, ...arguments_] = args;

  if (!command || command === "help" || command === "--help") {
    printHelp();
    return command ? 0 : 1;
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
    default:
      console.error(`Unknown command ${command}.`);
      printHelp();
      return 1;
  }
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

function printDiagnostics(diagnostics: Diagnostic[]): boolean {
  if (diagnostics.length === 0) {
    return false;
  }

  console.error(diagnostics.map(formatDiagnostic).join("\n\n"));
  return diagnostics.some(({ severity }) => severity === "error");
}

function printHelp(): void {
  console.log(`Usage:
  surf parse <file.kdl>
  surf check <file.kdl>
  surf format <file.kdl>
  surf export <file.kdl> --format json`);
}

if (import.meta.main) {
  try {
    Deno.exit(await main(Deno.args));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
