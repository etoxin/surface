import { InvalidKdlError, parse } from "@bgotink/kdl";

import { createDiagnostic } from "./diagnostics.js";

const IDENTIFIER_PATTERN = /^[a-z][A-Za-z0-9]*$/;
const TOP_LEVEL_NODES = new Set(["surface-lang", "application", "screen"]);

export function parseKdl(source, file = "surface.kdl") {
  try {
    return {
      document: parse(source, { storeLocations: true }),
      diagnostics: [],
    };
  } catch (error) {
    if (!(error instanceof InvalidKdlError)) {
      throw error;
    }

    const errors = typeof error.flat === "function" ? [...error.flat()] : [error];
    const diagnostics = errors.map((item) =>
      createDiagnostic({
        code: "SURF-KDL-002",
        message: item.message,
        file,
        line: item.start?.line,
        column: item.start?.column,
        suggestion: "Correct the KDL syntax and try again.",
      }),
    );

    return { document: null, diagnostics };
  }
}

export function parseSurface(source, file = "surface.kdl") {
  const parsed = parseKdl(source, file);
  if (!parsed.document) {
    return { ...parsed, ir: null };
  }

  const diagnostics = validateDocument(parsed.document, source, file);
  const ir = diagnostics.some(({ severity }) => severity === "error")
    ? null
    : buildIr(parsed.document);

  return { document: parsed.document, diagnostics, ir };
}

export function validateDocument(document, source, file = "surface.kdl") {
  const diagnostics = [];
  const add = (diagnostic) =>
    diagnostics.push(createDiagnostic({ file, ...diagnostic }));

  validateKdlMarker(source, add);

  const versionNodes = document.nodes.filter(
    (node) => node.getName() === "surface-lang",
  );

  if (versionNodes.length !== 1) {
    add({
      code: "SURF-VERSION-002",
      message: `Expected exactly one surface-lang node but found ${versionNodes.length}.`,
      element: versionNodes[1] ?? versionNodes[0],
      suggestion: 'Add exactly one surface-lang "0.1" node.',
    });
  }

  if (document.nodes[0]?.getName() !== "surface-lang") {
    add({
      code: "SURF-VERSION-004",
      message: "The surface-lang node must be the first semantic node.",
      element: document.nodes[0],
      suggestion: 'Move surface-lang "0.1" before all declarations.',
    });
  }

  for (const node of document.nodes) {
    const name = node.getName();
    if (!TOP_LEVEL_NODES.has(name)) {
      add({
        code: "SURF-NODE-001",
        message: `Unknown top-level node ${name}.`,
        element: node,
        suggestion: "Use only surface-lang, application, and screen nodes in Surface 0.1.",
      });
    }

    validateNoTag(node, add);
  }

  if (versionNodes.length > 0) {
    validateVersionNode(versionNodes[0], add);
  }

  const applications = document.nodes.filter(
    (node) => node.getName() === "application",
  );
  const screens = document.nodes.filter((node) => node.getName() === "screen");

  if (applications.length !== 1) {
    add({
      code: "SURF-APP-001",
      message: `Expected exactly one application declaration but found ${applications.length}.`,
      element: applications[1] ?? applications[0],
      suggestion:
        applications.length === 0
          ? "Add one application declaration."
          : "Remove the additional application declarations.",
    });
  }

  if (screens.length === 0) {
    add({
      code: "SURF-SCREEN-001",
      message: "The project must contain at least one screen declaration.",
      suggestion: "Add a screen with a route and at least one section.",
    });
  }

  const identities = new Set();
  for (const application of applications) {
    validateApplication(application, add);
    validateIdentity(application, identities, add);
  }

  for (const screen of screens) {
    validateScreen(screen, add);
    validateIdentity(screen, identities, add);
  }

  return diagnostics;
}

function validateKdlMarker(source, add) {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const firstLine = normalized.split("\n", 1)[0].trimEnd();
  if (firstLine !== "/- kdl-version 2") {
    add({
      code: "SURF-KDL-001",
      message: "The file must begin with the KDL 2 version marker.",
      line: 1,
      column: 1,
      suggestion: "Add /- kdl-version 2 as the first line.",
    });
  }
}

function validateVersionNode(node, add) {
  validateArguments(node, 1, "surface-lang", add);
  validateProperties(node, [], "surface-lang", add);
  validateNoChildren(node, "surface-lang", add);

  const version = node.getArgument(0);
  if (version !== undefined && typeof version !== "string") {
    add({
      code: "SURF-ARG-002",
      message: "The Surface language version must be a string.",
      element: node.getArgumentEntry(0),
      suggestion: 'Use surface-lang "0.1".',
    });
  } else if (typeof version === "string" && version !== "0.1") {
    add({
      code: "SURF-VERSION-003",
      message: `Unsupported Surface language version ${version}.`,
      element: node.getArgumentEntry(0),
      suggestion: 'Use surface-lang "0.1".',
    });
  }
}

function validateApplication(node, add) {
  const declaration = declarationName(node);
  validateArguments(node, 1, declaration, add, true);
  validateProperties(node, ["version"], declaration, add, ["version"]);

  const children = node.children?.nodes ?? [];
  const purposes = children.filter((child) => child.getName() === "purpose");
  for (const child of children) {
    if (child.getName() !== "purpose") {
      add({
        code: "SURF-CHILD-002",
        message: `Unknown child node ${child.getName()} in ${declaration}.`,
        element: child,
        declaration,
        suggestion: "Use exactly one purpose child node.",
      });
    }
  }

  if (purposes.length !== 1) {
    add({
      code: "SURF-CHILD-001",
      message: `${declaration} must contain exactly one purpose child node.`,
      element: purposes[1] ?? node,
      declaration,
      suggestion: 'Add purpose "Describe the application." exactly once.',
    });
  }

  for (const purpose of purposes) {
    validateLeafStringNode(purpose, "purpose", declaration, add);
  }
}

function validateScreen(node, add) {
  const declaration = declarationName(node);
  validateArguments(node, 1, declaration, add, true);
  validateProperties(node, ["route"], declaration, add, ["route"]);

  const children = node.children?.nodes ?? [];
  const sections = children.filter((child) => child.getName() === "section");
  for (const child of children) {
    if (child.getName() !== "section") {
      add({
        code: "SURF-CHILD-002",
        message: `Unknown child node ${child.getName()} in ${declaration}.`,
        element: child,
        declaration,
        suggestion: "Use only section child nodes in a screen.",
      });
    }
  }

  if (sections.length === 0) {
    add({
      code: "SURF-CHILD-003",
      message: `${declaration} must contain at least one section child node.`,
      element: node,
      declaration,
      suggestion: 'Add a section such as section "Hello, world!".',
    });
  }

  for (const section of sections) {
    validateLeafStringNode(section, "section", declaration, add);
  }
}

function validateLeafStringNode(node, name, declaration, add) {
  validateNoTag(node, add, declaration);
  validateArguments(node, 1, `${declaration}.${name}`, add);
  validateProperties(node, [], `${declaration}.${name}`, add);
  validateNoChildren(node, `${declaration}.${name}`, add);

  const value = node.getArgument(0);
  if (value !== undefined && typeof value !== "string") {
    add({
      code: "SURF-ARG-002",
      message: `${name} must contain one string argument.`,
      element: node.getArgumentEntry(0),
      declaration,
      suggestion: `Write ${name} followed by one quoted string.`,
    });
  }
}

function validateArguments(node, count, subject, add, identifier = false) {
  const arguments_ = node.getArguments();
  if (arguments_.length !== count) {
    add({
      code: "SURF-ARG-001",
      message: `${subject} must contain exactly ${count} argument${count === 1 ? "" : "s"}.`,
      element: node,
      declaration: subject.includes(".") ? subject : undefined,
      suggestion: `Provide exactly ${count} quoted string argument${count === 1 ? "" : "s"}.`,
    });
  }

  if (identifier && arguments_.length > 0) {
    const value = arguments_[0];
    if (typeof value !== "string") {
      add({
        code: "SURF-ARG-002",
        message: `${subject} identifier must be a string.`,
        element: node.getArgumentEntry(0),
        suggestion: "Use one quoted lower-camel-case identifier.",
      });
    } else if (!IDENTIFIER_PATTERN.test(value)) {
      add({
        code: "SURF-ID-001",
        message: `Invalid declaration identifier ${value}.`,
        element: node.getArgumentEntry(0),
        declaration: `${node.getName()}.${value}`,
        suggestion: "Use lower camel case beginning with a lowercase ASCII letter.",
      });
    }
  }
}

function validateProperties(node, allowed, subject, add, required = []) {
  const allowedNames = new Set(allowed);
  const propertyCounts = new Map();

  for (const entry of node.getPropertyEntries()) {
    const name = entry.getName();
    propertyCounts.set(name, (propertyCounts.get(name) ?? 0) + 1);

    if (!allowedNames.has(name)) {
      add({
        code: "SURF-PROP-003",
        message: `Unknown property ${name} on ${subject}.`,
        element: entry,
        declaration: subject.includes(".") ? subject : undefined,
        suggestion:
          allowed.length === 0
            ? "Remove the property."
            : `Use only these properties: ${allowed.join(", ")}.`,
      });
    }

    if (typeof entry.getValue() !== "string") {
      add({
        code: "SURF-PROP-004",
        message: `Property ${name} on ${subject} must be a string.`,
        element: entry,
        declaration: subject.includes(".") ? subject : undefined,
        suggestion: `Assign ${name} a quoted string value.`,
      });
    }

    if (entry.getTag() !== null) {
      add({
        code: "SURF-TAG-001",
        message: `Type annotations are not supported on property ${name}.`,
        element: entry,
        suggestion: "Remove the KDL type annotation.",
      });
    }
  }

  for (const [name, count] of propertyCounts) {
    if (count > 1) {
      add({
        code: "SURF-PROP-002",
        message: `Property ${name} occurs ${count} times on ${subject}.`,
        element: node,
        declaration: subject.includes(".") ? subject : undefined,
        suggestion: `Keep exactly one ${name} property.`,
      });
    }
  }

  for (const name of required) {
    if (!propertyCounts.has(name)) {
      add({
        code: "SURF-PROP-001",
        message: `${subject} is missing required property ${name}.`,
        element: node,
        declaration: subject.includes(".") ? subject : undefined,
        suggestion: `Add ${name}="..." to the declaration.`,
      });
    }
  }
}

function validateNoChildren(node, subject, add) {
  if (node.children !== null) {
    add({
      code: "SURF-CHILD-004",
      message: `${subject} must not contain a child block.`,
      element: node,
      declaration: subject.includes(".") ? subject : undefined,
      suggestion: "Remove the child block.",
    });
  }
}

function validateNoTag(node, add, declaration) {
  if (node.getTag() !== null) {
    add({
      code: "SURF-TAG-001",
      message: `Type annotations are not supported on ${node.getName()} nodes.`,
      element: node,
      declaration,
      suggestion: "Remove the KDL type annotation.",
    });
  }

  for (const entry of node.getArgumentEntries()) {
    if (entry.getTag() !== null) {
      add({
        code: "SURF-TAG-001",
        message: `Type annotations are not supported on ${node.getName()} arguments.`,
        element: entry,
        declaration,
        suggestion: "Remove the KDL type annotation.",
      });
    }
  }
}

function validateIdentity(node, identities, add) {
  const id = node.getArgument(0);
  if (typeof id !== "string" || !IDENTIFIER_PATTERN.test(id)) {
    return;
  }

  const identity = `${node.getName()}.${id}`;
  if (identities.has(identity)) {
    add({
      code: "SURF-ID-002",
      message: `Duplicate declaration ${identity}.`,
      element: node,
      declaration: identity,
      suggestion: "Rename or remove one of the duplicate declarations.",
    });
  }
  identities.add(identity);
}

function declarationName(node) {
  const id = node.getArgument(0);
  return typeof id === "string" ? `${node.getName()}.${id}` : node.getName();
}

function buildIr(document) {
  const version = document.findNodeByName("surface-lang");
  const application = document.findNodeByName("application");
  const screens = document.nodes.filter((node) => node.getName() === "screen");

  return {
    surfaceVersion: version.getArgument(0),
    application: {
      id: application.getArgument(0),
      version: application.getProperty("version"),
      purpose: application.children.findNodeByName("purpose").getArgument(0),
    },
    screens: screens.map((screen) => ({
      id: screen.getArgument(0),
      route: screen.getProperty("route"),
      sections: screen.children
        .findNodesByName("section")
        .map((section) => section.getArgument(0)),
    })),
  };
}
