#!/usr/bin/env -S deno run --allow-read --allow-write

import { resolve } from "node:path";

import { type Diagnostic, formatDiagnostic } from "./diagnostics.ts";
import { formatSurface } from "./formatter.ts";
import { parseKdl, parseSurface, type SurfaceIr } from "./surface.ts";

interface SurfaceReference {
  selector: string;
  reference: string;
  scope?: string;
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
    case "reference":
      return runReference(source, fileArgument, arguments_.slice(1));
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

function runReference(source: string, file: string, args: string[]): number {
  const result = parseSurface(source, file);
  if (printDiagnostics(result.diagnostics)) {
    return 1;
  }
  if (result.ir === null) {
    console.error(`Could not read Surface references from ${file}.`);
    return 1;
  }

  const references = collectReferences(result.ir);
  const selector = args[0];
  if (args.length !== 1 || selector === undefined) {
    console.error(
      `Usage: surf reference <file.kdl> <selector|--list>`,
    );
    return 1;
  }
  if (selector === "--list") {
    console.log(JSON.stringify(references, null, 2));
    return 0;
  }

  const match = references.find((reference) => reference.selector === selector);
  if (match === undefined) {
    console.error(
      `Unknown declaration selector ${selector}. Run surf reference ${file} --list to see available references.`,
    );
    return 1;
  }

  console.log(match.reference);
  return 0;
}

function collectReferences(ir: SurfaceIr): SurfaceReference[] {
  const references: SurfaceReference[] = [{
    selector: `application.${ir.application.id}`,
    reference: `(application)"${ir.application.id}"`,
  }];

  for (const value of ir.values ?? []) {
    references.push({
      selector: `value.${value.id}`,
      reference: `(value)"${value.id}"`,
    });
  }
  for (const collection of ir.collections ?? []) {
    references.push({
      selector: `collection.${collection.id}`,
      reference: `(collection)"${collection.id}"`,
    });
  }
  for (const functionNode of ir.functions ?? []) {
    const functionSelector = `function.${functionNode.id}`;
    references.push({
      selector: functionSelector,
      reference: `(function)"${functionNode.id}"`,
    });
    for (const collection of functionNode.collections ?? []) {
      references.push({
        selector: `${functionSelector}.collection.${collection.id}`,
        reference: `(collection)"${collection.id}"`,
        scope: functionSelector,
      });
    }
  }
  for (const interfaceNode of ir.interfaces ?? []) {
    references.push({
      selector: `interface.${interfaceNode.id}`,
      reference: `(interface)"${interfaceNode.id}"`,
    });
  }
  for (const screen of ir.screens) {
    references.push({
      selector: `screen.${screen.id}`,
      reference: `(screen)"${screen.id}"`,
    });
  }

  return references;
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
  surf export <file.kdl> --format json
  surf reference <file.kdl> <selector|--list>`);
}

if (import.meta.main) {
  try {
    Deno.exit(await main(Deno.args));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
