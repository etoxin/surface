import type { Diagnostic } from "./diagnostics.ts";
import { parseKdl } from "./surface.ts";

export interface FormatResult {
  output: string | null;
  diagnostics: Diagnostic[];
}

export function formatSurface(
  source: string,
  file = "surface.kdl",
): FormatResult {
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
  let multiline: MultilineState | null = null;
  const output: string[] = [];

  for (const originalLine of lines) {
    if (multiline !== null) {
      const closing = matchMultilineClose(originalLine, multiline.delimiter);
      if (closing === null) {
        multiline.lines.push(originalLine);
        continue;
      }

      const indentation = "    ".repeat(multiline.indentation);
      for (const multilineLine of multiline.lines) {
        if (multilineLine.trim() === "") {
          output.push("");
          continue;
        }

        const value = multilineLine.startsWith(closing.sourcePrefix)
          ? multilineLine.slice(closing.sourcePrefix.length)
          : multilineLine;
        output.push(`${indentation}${value}`);
      }

      const suffix = closing.suffix.replace(/[ \t]+$/g, "");
      output.push(`${indentation}${multiline.delimiter}${suffix}`);
      const scanned = scanBraces(suffix, false);
      inBlockComment = scanned.inBlockComment;
      depth = Math.max(0, depth + scanned.open - scanned.close);
      multiline = null;
      continue;
    }

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
    if (scanned.multilineDelimiter !== undefined) {
      multiline = {
        delimiter: scanned.multilineDelimiter,
        indentation: indentation + 1,
        lines: [],
      };
    }
  }

  return { output: `${output.join("\n")}\n`, diagnostics: [] };
}

interface MultilineState {
  delimiter: string;
  indentation: number;
  lines: string[];
}

interface MultilineClose {
  sourcePrefix: string;
  suffix: string;
}

function matchMultilineClose(
  line: string,
  delimiter: string,
): MultilineClose | null {
  const content = line.trimStart();
  if (!content.startsWith(delimiter)) {
    return null;
  }

  return {
    sourcePrefix: line.slice(0, line.length - content.length),
    suffix: content.slice(delimiter.length),
  };
}

function scanBraces(
  line: string,
  initialBlockComment: boolean,
): {
  open: number;
  close: number;
  inBlockComment: boolean;
  multilineDelimiter?: string;
} {
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
    } else if (character === '"' && line.slice(index, index + 3) === '"""') {
      return {
        open,
        close,
        inBlockComment,
        multilineDelimiter: '"""',
      };
    } else if (character === "#") {
      let hashEnd = index;
      while (line[hashEnd] === "#") {
        hashEnd += 1;
      }
      if (line.slice(hashEnd, hashEnd + 3) === '"""') {
        return {
          open,
          close,
          inBlockComment,
          multilineDelimiter: `"""${"#".repeat(hashEnd - index)}`,
        };
      }
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
