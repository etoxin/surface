#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { formatDiagnostic } from "./diagnostics.js";
import { formatSurface } from "./formatter.js";
import { parseKdl, parseSurface } from "./surface.js";

const [, , command, ...arguments_] = process.argv;

try {
  const exitCode = await run(command, arguments_);
  process.exitCode = exitCode;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function run(selectedCommand, args) {
  if (!selectedCommand || selectedCommand === "help" || selectedCommand === "--help") {
    printHelp();
    return selectedCommand ? 0 : 1;
  }

  const fileArgument = args[0];
  if (!fileArgument) {
    console.error(`Missing file for surf ${selectedCommand}.`);
    printHelp();
    return 1;
  }

  const file = path.resolve(fileArgument);
  const source = await readFile(file, "utf8");

  switch (selectedCommand) {
    case "parse":
      return runParse(source, fileArgument);
    case "check":
      return runCheck(source, fileArgument);
    case "format":
      return runFormat(source, file, fileArgument);
    case "export":
      return runExport(source, fileArgument, args.slice(1));
    default:
      console.error(`Unknown command ${selectedCommand}.`);
      printHelp();
      return 1;
  }
}

function runParse(source, file) {
  const result = parseKdl(source, file);
  if (printDiagnostics(result.diagnostics)) {
    return 1;
  }

  console.log(`Parsed ${file}: ${result.document.nodes.length} top-level nodes.`);
  return 0;
}

function runCheck(source, file) {
  const result = parseSurface(source, file);
  if (printDiagnostics(result.diagnostics)) {
    return 1;
  }

  console.log(`OK ${file}`);
  return 0;
}

async function runFormat(source, absoluteFile, displayFile) {
  const checked = parseSurface(source, displayFile);
  if (printDiagnostics(checked.diagnostics)) {
    return 1;
  }

  const result = formatSurface(source, displayFile);
  if (printDiagnostics(result.diagnostics)) {
    return 1;
  }

  await writeFile(absoluteFile, result.output, "utf8");
  console.log(`Formatted ${displayFile}`);
  return 0;
}

function runExport(source, file, args) {
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

function printDiagnostics(diagnostics) {
  if (diagnostics.length === 0) {
    return false;
  }

  console.error(diagnostics.map(formatDiagnostic).join("\n\n"));
  return diagnostics.some(({ severity }) => severity === "error");
}

function printHelp() {
  console.log(`Usage:
  surf parse <file.kdl>
  surf check <file.kdl>
  surf format <file.kdl>
  surf export <file.kdl> --format json`);
}
