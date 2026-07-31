import { getLocation } from "@bgotink/kdl";

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
}) {
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

export function formatDiagnostic(diagnostic) {
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

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
