import { getLocation } from "@bgotink/kdl";

export interface Diagnostic {
  severity: string;
  code: string;
  message: string;
  file: string;
  line: number;
  column: number;
  declaration?: string;
  suggestion?: string;
}

export interface DiagnosticInput {
  severity?: string;
  code: string;
  message: string;
  file: string;
  element?: Parameters<typeof getLocation>[0];
  line?: number;
  column?: number;
  declaration?: string;
  suggestion?: string;
}

export function createDiagnostic({
  severity = "error",
  code,
  message,
  file,
  element,
  line,
  column,
  declaration,
  suggestion,
}: DiagnosticInput): Diagnostic {
  const location = element ? getLocation(element)?.start : undefined;

  return {
    severity,
    code,
    message,
    file,
    line: line ?? location?.line ?? 1,
    column: column ?? location?.column ?? 1,
    ...(declaration ? { declaration } : {}),
    ...(suggestion ? { suggestion } : {}),
  };
}

export function formatDiagnostic(diagnostic: Diagnostic): string {
  const title = `${capitalize(diagnostic.severity)} ${diagnostic.code}`;
  const details = [
    title,
    "",
    diagnostic.message,
    "",
    `File: ${diagnostic.file}`,
    `Location: ${diagnostic.line}:${diagnostic.column}`,
  ];

  if (diagnostic.declaration) {
    details.push(`Declaration: ${diagnostic.declaration}`);
  }

  if (diagnostic.suggestion) {
    details.push(`Suggested correction: ${diagnostic.suggestion}`);
  }

  return details.join("\n");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
