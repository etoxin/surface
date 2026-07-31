import { parseKdl } from "./surface.js";

export function formatSurface(source, file = "surface.kdl") {
  const parsed = parseKdl(source, file);
  if (parsed.diagnostics.length > 0) {
    return { output: null, diagnostics: parsed.diagnostics };
  }

  const normalized = source.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  if (lines.at(-1) === "") {
    lines.pop();
  }

  let depth = 0;
  let inBlockComment = false;
  const output = [];

  for (const originalLine of lines) {
    const line = originalLine.replace(/[ \t]+$/g, "");
    const content = line.trimStart();

    if (content === "") {
      output.push("");
      continue;
    }

    const startsWithClose = !inBlockComment && content.startsWith("}");
    const indentation = Math.max(0, depth - (startsWithClose ? 1 : 0));
    output.push(`${"    ".repeat(indentation)}${content}`);

    const scanned = scanBraces(content, inBlockComment);
    inBlockComment = scanned.inBlockComment;
    depth = Math.max(0, depth + scanned.open - scanned.close);
  }

  return { output: `${output.join("\n")}\n`, diagnostics: [] };
}

function scanBraces(line, initialBlockComment) {
  let open = 0;
  let close = 0;
  let inBlockComment = initialBlockComment;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (inBlockComment) {
      if (character === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === "/" && next === "/") {
      break;
    }
    if (character === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
    } else if (character === '"') {
      inString = true;
    } else if (character === "{") {
      open += 1;
    } else if (character === "}") {
      close += 1;
    }
  }

  return { open, close, inBlockComment };
}
