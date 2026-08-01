import {
  type Document,
  InvalidKdlError,
  type Node,
  parse,
  type Primitive,
} from "@bgotink/kdl";

import {
  createDiagnostic,
  type Diagnostic,
  type DiagnosticInput,
} from "./diagnostics.ts";

export interface SurfaceIr {
  surfaceVersion: string;
  application: {
    id: string;
    purpose: string;
  };
  entities?: SurfaceEntityIr[];
  queries?: SurfaceQueryIr[];
  interfaces?: SurfaceInterfaceIr[];
  screens: SurfaceScreenIr[];
}

export interface SurfaceEntityIr {
  id: string;
  fields: SurfaceFieldIr[];
}

export interface SurfaceFieldIr {
  name: string;
  type: PrimitiveType;
  optional?: boolean;
}

export interface SurfaceQueryIr {
  id: string;
  entities?: SurfaceEntityIr[];
  input?: {
    entity: string;
  };
  returns: {
    entity: string;
  };
}

export interface SurfaceScreenIr {
  id: string;
  route?: string;
  interface?: string;
}

export interface SurfaceInterfaceIr {
  id: string;
}

export interface KdlParseResult {
  document: Document | null;
  diagnostics: Diagnostic[];
}

export interface SurfaceParseResult extends KdlParseResult {
  ir: SurfaceIr | null;
}

type DiagnosticDraft = Omit<DiagnosticInput, "file">;
type AddDiagnostic = (diagnostic: DiagnosticDraft) => void;
type PrimitiveType = "string" | "boolean";
type PropertyType = "string" | "boolean";

const IDENTIFIER_PATTERN = /^[a-z][A-Za-z0-9]*$/;
const PRIMITIVE_TYPES = new Set<PrimitiveType>(["string", "boolean"]);
const FIELD_MODIFIERS = new Set(["optional"]);
const CONTEXT_REFERENCE_TYPES = new Set([
  "application",
  "entity",
  "interface",
  "query",
  "screen",
]);
const TOP_LEVEL_NODES = new Set([
  "surface",
  "application",
  "entity",
  "interface",
  "query",
  "screen",
]);

export function parseKdl(source: string, file = "surface.kdl"): KdlParseResult {
  try {
    return {
      document: parse(source, { storeLocations: true }),
      diagnostics: [],
    };
  } catch (error) {
    if (!(error instanceof InvalidKdlError)) {
      throw error;
    }

    const errors = [...error.flat()];
    const diagnostics = errors.map((item) =>
      createDiagnostic({
        code: "SURF-KDL-002",
        message: item.message,
        file,
        line: item.start?.line,
        column: item.start?.column,
        suggestion: "Correct the KDL syntax and try again.",
      })
    );

    return { document: null, diagnostics };
  }
}

export function parseSurface(
  source: string,
  file = "surface.kdl",
): SurfaceParseResult {
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

export function validateDocument(
  document: Document,
  source: string,
  file = "surface.kdl",
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const add: AddDiagnostic = (diagnostic) =>
    diagnostics.push(createDiagnostic({ file, ...diagnostic }));

  validateKdlMarker(source, add);

  const versionNodes = document.nodes.filter(
    (node) => node.getName() === "surface",
  );

  if (versionNodes.length !== 1) {
    add({
      code: "SURF-VERSION-002",
      message: `Expected exactly one surface node but found ${versionNodes.length}.`,
      element: versionNodes[1] ?? versionNodes[0],
      suggestion: 'Add exactly one surface "0.1" node.',
    });
  }

  if (document.nodes[0]?.getName() !== "surface") {
    add({
      code: "SURF-VERSION-004",
      message: "The surface node must be the first semantic node.",
      element: document.nodes[0],
      suggestion: 'Move surface "0.1" before all declarations.',
    });
  }

  for (const node of document.nodes) {
    const name = node.getName();
    if (!TOP_LEVEL_NODES.has(name)) {
      add({
        code: "SURF-NODE-001",
        message: `Unknown top-level node ${name}.`,
        element: node,
        suggestion:
          "Use only surface, application, entity, query, interface, and screen nodes in Surface 0.1.",
      });
    }

    validateNoTag(node, add);
  }

  if (versionNodes.length > 0) {
    validateSurfaceNode(versionNodes[0], add);
  }

  const applications = document.nodes.filter(
    (node) => node.getName() === "application",
  );
  const entities = document.nodes.filter((node) => node.getName() === "entity");
  const interfaces = document.nodes.filter(
    (node) => node.getName() === "interface",
  );
  const queries = document.nodes.filter((node) => node.getName() === "query");
  const screens = document.nodes.filter((node) => node.getName() === "screen");

  if (applications.length !== 1) {
    add({
      code: "SURF-APP-001",
      message:
        `Expected exactly one application declaration but found ${applications.length}.`,
      element: applications[1] ?? applications[0],
      suggestion: applications.length === 0
        ? "Add one application declaration."
        : "Remove the additional application declarations.",
    });
  }

  if (screens.length === 0) {
    add({
      code: "SURF-SCREEN-001",
      message: "The project must contain at least one screen declaration.",
      suggestion: "Add a screen that uses an interface or contains prompt context.",
    });
  }

  const identities = new Set<string>();
  for (const application of applications) {
    validateApplication(application, add);
    validateIdentity(application, identities, add);
  }

  for (const entity of entities) {
    validateEntity(entity, add);
    validateIdentity(entity, identities, add);
  }

  for (const query of queries) {
    validateQuery(query, add);
    validateIdentity(query, identities, add);
  }

  for (const interfaceNode of interfaces) {
    validateInterface(interfaceNode, add);
    validateIdentity(interfaceNode, identities, add);
  }

  for (const screen of screens) {
    validateScreen(screen, add);
    validateIdentity(screen, identities, add);
  }

  validateReferences(
    versionNodes,
    applications,
    entities,
    queries,
    interfaces,
    screens,
    add,
  );

  return diagnostics;
}

function validateKdlMarker(source: string, add: AddDiagnostic): void {
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

function validateSurfaceNode(node: Node, add: AddDiagnostic): void {
  validateArguments(node, 1, "surface", add);
  validateProperties(node, [], "surface", add);
  validateOnlyContextChildren(node, "surface", add);

  const version = node.getArgument(0);
  if (version !== undefined && typeof version !== "string") {
    add({
      code: "SURF-ARG-002",
      message: "The Surface format version must be a string.",
      element: node.getArgumentEntry(0),
      suggestion: 'Use surface "0.1".',
    });
  } else if (typeof version === "string" && version !== "0.1") {
    add({
      code: "SURF-VERSION-003",
      message: `Unsupported Surface format version ${version}.`,
      element: node.getArgumentEntry(0),
      suggestion: 'Use surface "0.1".',
    });
  }
}

function validateApplication(node: Node, add: AddDiagnostic): void {
  const declaration = declarationName(node);
  validateArguments(node, 1, declaration, add, true);
  validateProperties(node, [], declaration, add);

  const children = node.children?.nodes ?? [];
  const purposes = children.filter((child) => child.getName() === "purpose");
  for (const child of children) {
    if (child.getName() === "context") {
      validateContextNode(child, declaration, add);
      continue;
    }

    if (child.getName() !== "purpose") {
      add({
        code: "SURF-CHILD-002",
        message: `Unknown child node ${child.getName()} in ${declaration}.`,
        element: child,
        declaration,
        suggestion: "Use one purpose child and optional context children.",
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

function validateEntity(
  node: Node,
  add: AddDiagnostic,
  parentDeclaration?: string,
): void {
  const id = node.getArgument(0);
  const declaration = parentDeclaration === undefined
    ? declarationName(node)
    : `${parentDeclaration}.entity.${typeof id === "string" ? id : "?"}`;
  validateArguments(node, 1, declaration, add, true);
  validateProperties(node, [], declaration, add);

  const children = node.children?.nodes ?? [];
  const fields = children.filter(isEntityFieldNode);
  for (const child of children) {
    if (!isEntityFieldNode(child)) {
      validateContextNode(child, declaration, add);
    }
  }

  if (fields.length === 0) {
    add({
      code: "SURF-CHILD-003",
      message: `${declaration} must contain at least one field child node.`,
      element: node,
      declaration,
      suggestion: 'Add a field such as (string)"id".',
    });
  }

  const fieldNames = new Set<string>();
  for (const field of fields) {
    validateFieldDeclaration(field, declaration, add);
    validateFieldIdentity(field, fieldNames, declaration, add);
  }
}

function isEntityFieldNode(node: Node): boolean {
  return node.getTag() !== null || node.getName() !== "context";
}

function validateFieldDeclaration(
  node: Node,
  declaration: string,
  add: AddDiagnostic,
): void {
  const name = node.getName();
  const subject = `${declaration}.field.${name}`;

  if (!IDENTIFIER_PATTERN.test(name)) {
    add({
      code: "SURF-ID-001",
      message: `Invalid field identifier ${name}.`,
      element: node,
      declaration: subject,
      suggestion: "Use lower camel case beginning with a lowercase ASCII letter.",
    });
  }

  validateFieldType(node, subject, declaration, add);
  validateFieldModifiers(node, subject, add);
  validateProperties(node, [], subject, add);
  validateOnlyContextChildren(node, subject, add);
}

function validateFieldType(
  node: Node,
  subject: string,
  declaration: string,
  add: AddDiagnostic,
): void {
  const type = node.getTag();
  if (type === null) {
    add({
      code: "SURF-TYPE-002",
      message: `${subject} is missing its primitive node type.`,
      element: node,
      declaration,
      suggestion: `Annotate the field node as (string) or (boolean).`,
    });
  } else if (!PRIMITIVE_TYPES.has(type as PrimitiveType)) {
    add({
      code: "SURF-TYPE-001",
      message: `Unsupported primitive type ${type} on ${subject}.`,
      element: node,
      declaration,
      suggestion: "Use (string) or (boolean).",
    });
  }
}

function validateFieldModifiers(
  node: Node,
  subject: string,
  add: AddDiagnostic,
): void {
  const arguments_ = node.getArguments();
  const seen = new Set<string>();
  for (let index = 0; index < arguments_.length; index++) {
    const modifier = arguments_[index];
    if (typeof modifier !== "string" || !FIELD_MODIFIERS.has(modifier)) {
      add({
        code: "SURF-ARG-003",
        message: `Unsupported field modifier ${String(modifier)} on ${subject}.`,
        element: node.getArgumentEntry(index),
        declaration: subject,
        suggestion: "Use only the bare optional modifier.",
      });
      continue;
    }

    if (seen.has(modifier)) {
      add({
        code: "SURF-ARG-004",
        message: `Duplicate field modifier ${modifier} on ${subject}.`,
        element: node.getArgumentEntry(index),
        declaration: subject,
        suggestion: `Keep only one ${modifier} modifier.`,
      });
    }
    seen.add(modifier);

    if (node.getArgumentEntry(index)?.getTag() !== null) {
      add({
        code: "SURF-TAG-001",
        message: `Field modifier ${modifier} must not have a type annotation.`,
        element: node.getArgumentEntry(index),
        declaration: subject,
        suggestion: `Write ${modifier} as a bare modifier.`,
      });
    }
  }
}

function validateFieldIdentity(
  node: Node,
  fieldNames: Set<string>,
  declaration: string,
  add: AddDiagnostic,
): void {
  const name = node.getName();
  if (fieldNames.has(name)) {
    add({
      code: "SURF-ID-002",
      message: `Duplicate declaration field.${name}.`,
      element: node,
      declaration: `${declaration}.field.${name}`,
      suggestion: "Rename or remove one of the duplicate fields.",
    });
  }
  fieldNames.add(name);
}

function validateQuery(node: Node, add: AddDiagnostic): void {
  const declaration = declarationName(node);
  validateArguments(node, 1, declaration, add, true);
  validateProperties(node, [], declaration, add);

  const children = node.children?.nodes ?? [];
  const entities = children.filter((child) => child.getName() === "entity");
  const inputs = children.filter((child) => child.getName() === "input");
  const returnsNodes = children.filter((child) => child.getName() === "returns");
  for (const child of children) {
    if (child.getName() === "context") {
      validateContextNode(child, declaration, add);
      continue;
    }

    if (
      child.getName() !== "entity" && child.getName() !== "input" &&
      child.getName() !== "returns"
    ) {
      add({
        code: "SURF-CHILD-002",
        message: `Unknown child node ${child.getName()} in ${declaration}.`,
        element: child,
        declaration,
        suggestion: "Use entity, input, returns, and context child nodes in a query.",
      });
    }
  }

  if (inputs.length > 1) {
    add({
      code: "SURF-CHILD-005",
      message: `${declaration} may contain at most one input child node.`,
      element: inputs[1],
      declaration,
      suggestion: "Keep no more than one typed entity input reference.",
    });
  }

  if (returnsNodes.length !== 1) {
    add({
      code: "SURF-CHILD-001",
      message: `${declaration} must contain exactly one returns child node.`,
      element: returnsNodes[1] ?? node,
      declaration,
      suggestion: 'Add returns (entity)"entityId" exactly once.',
    });
  }

  const localIdentities = new Set<string>();
  for (const entity of entities) {
    validateEntity(entity, add, declaration);
    validateIdentity(entity, localIdentities, add);
  }

  for (const input of inputs) {
    validateInput(input, declaration, add);
  }

  for (const returnsNode of returnsNodes) {
    validateReturns(returnsNode, declaration, add);
  }
}

function validateInput(
  node: Node,
  declaration: string,
  add: AddDiagnostic,
): void {
  const subject = `${declaration}.input`;
  validateReferenceNode(node, "entity", subject, declaration, add);
  validateProperties(node, [], subject, add);
  validateOnlyContextChildren(node, subject, add);
}

function validateReturns(
  node: Node,
  declaration: string,
  add: AddDiagnostic,
): void {
  const subject = `${declaration}.returns`;
  validateReferenceNode(node, "entity", subject, declaration, add);
  validateProperties(node, [], subject, add);
  validateOnlyContextChildren(node, subject, add);
}

function validateInterface(node: Node, add: AddDiagnostic): void {
  const declaration = declarationName(node);
  validateArguments(node, 1, declaration, add, true);
  validateProperties(node, [], declaration, add);
  validateOnlyContextChildren(node, declaration, add);
}

function validateScreen(node: Node, add: AddDiagnostic): void {
  const declaration = declarationName(node);
  validateArguments(node, 1, declaration, add, true);
  validateProperties(node, ["route"], declaration, add);

  const children = node.children?.nodes ?? [];
  const uses = children.filter((child) => child.getName() === "use");
  const contexts = children.filter((child) => child.getName() === "context");
  for (const child of children) {
    if (child.getName() === "context") {
      validateContextNode(child, declaration, add);
      continue;
    }

    if (child.getName() !== "use") {
      add({
        code: "SURF-CHILD-002",
        message: `Unknown child node ${child.getName()} in ${declaration}.`,
        element: child,
        declaration,
        suggestion: "Use only one interface use and optional context children.",
      });
    }
  }

  if (uses.length > 1) {
    add({
      code: "SURF-CHILD-005",
      message: `${declaration} may contain at most one use child node.`,
      element: uses[1],
      declaration,
      suggestion: "Keep no more than one use (interface) reference.",
    });
  }

  for (const use of uses) {
    validateUse(use, declaration, add);
  }

  if (uses.length === 0 && contexts.length === 0) {
    add({
      code: "SURF-CHILD-003",
      message: `${declaration} must use an interface or contain context.`,
      element: node,
      declaration,
      suggestion:
        'Add use (interface)"interfaceId" or describe non-visual behavior with context.',
    });
  }
}

function validateUse(
  node: Node,
  declaration: string,
  add: AddDiagnostic,
): void {
  const subject = `${declaration}.use`;
  validateReferenceNode(node, "interface", subject, declaration, add);
  validateProperties(node, [], subject, add);
  validateOnlyContextChildren(node, subject, add);
}

function validateLeafStringNode(
  node: Node,
  name: string,
  declaration: string,
  add: AddDiagnostic,
  allowContext = true,
): void {
  validateNoTag(node, add, declaration);
  validateArguments(node, 1, `${declaration}.${name}`, add);
  validateProperties(node, [], `${declaration}.${name}`, add);
  if (allowContext) {
    validateOnlyContextChildren(node, `${declaration}.${name}`, add);
  } else {
    validateNoChildren(node, `${declaration}.${name}`, add);
  }

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

function validateContextNode(
  node: Node,
  declaration: string,
  add: AddDiagnostic,
): void {
  const subject = `${declaration}.context`;
  if (node.getTag() !== null) {
    add({
      code: "SURF-TAG-001",
      message: "Type annotations are not supported on context nodes.",
      element: node,
      declaration,
      suggestion: "Annotate referenced string arguments instead.",
    });
  }
  validateProperties(node, [], subject, add);
  validateNoChildren(node, subject, add);

  const entries = node.getArgumentEntries();
  if (entries.length === 0) {
    add({
      code: "SURF-ARG-001",
      message: `${subject} must end with one quoted prompt string.`,
      element: node,
      declaration,
      suggestion: 'Add a prompt such as "Keep this concise.".',
    });
    return;
  }

  const prompt = entries.at(-1);
  if (typeof prompt?.getValue() !== "string") {
    add({
      code: "SURF-ARG-002",
      message: "The final context argument must be a quoted prompt string.",
      element: prompt ?? node,
      declaration,
      suggestion: 'End context with a prompt such as "Keep this concise.".',
    });
  }
  if (prompt?.getTag() !== null) {
    add({
      code: "SURF-TAG-001",
      message: "The final context prompt must not have a type annotation.",
      element: prompt,
      declaration,
      suggestion: "Put typed references before the final unannotated prompt.",
    });
  }

  for (const reference of entries.slice(0, -1)) {
    const value = reference.getValue();
    const type = reference.getTag();
    if (typeof value !== "string") {
      add({
        code: "SURF-ARG-002",
        message: "Context references must be quoted strings.",
        element: reference,
        declaration,
        suggestion: 'Use a typed string such as (screen)"home".',
      });
    }
    if (type === null) {
      add({
        code: "SURF-REF-003",
        message: "Every context argument before the prompt must be a typed reference.",
        element: reference,
        declaration,
        suggestion: 'Add a declaration annotation such as (screen)"home".',
      });
    } else if (!CONTEXT_REFERENCE_TYPES.has(type)) {
      add({
        code: "SURF-REF-002",
        message: `Unsupported context reference type ${type}.`,
        element: reference,
        declaration,
        suggestion: "Use application, entity, interface, query, or screen references.",
      });
    }
  }
}

function validateOnlyContextChildren(
  node: Node,
  subject: string,
  add: AddDiagnostic,
): void {
  for (const child of node.children?.nodes ?? []) {
    if (child.getName() === "context") {
      validateContextNode(child, subject, add);
      continue;
    }

    add({
      code: "SURF-CHILD-002",
      message: `Unknown child node ${child.getName()} in ${subject}.`,
      element: child,
      declaration: subject.includes(".") ? subject : undefined,
      suggestion: "Use only context child nodes here.",
    });
  }
}

function validateArguments(
  node: Node,
  count: number,
  subject: string,
  add: AddDiagnostic,
  identifier = false,
): void {
  const arguments_ = node.getArguments();
  if (arguments_.length !== count) {
    add({
      code: "SURF-ARG-001",
      message: `${subject} must contain exactly ${count} argument${
        count === 1 ? "" : "s"
      }.`,
      element: node,
      declaration: subject.includes(".") ? subject : undefined,
      suggestion: `Provide exactly ${count} quoted string argument${
        count === 1 ? "" : "s"
      }.`,
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

function validateProperties(
  node: Node,
  allowed: readonly string[],
  subject: string,
  add: AddDiagnostic,
  required: readonly string[] = [],
  propertyTypes: Readonly<Record<string, PropertyType>> = {},
): void {
  const allowedNames = new Set(allowed);
  const propertyCounts = new Map<string, number>();

  for (const entry of node.getPropertyEntries()) {
    const name = entry.getName();
    if (name === null) {
      throw new Error("KDL property entry is missing its name.");
    }
    propertyCounts.set(name, (propertyCounts.get(name) ?? 0) + 1);

    if (!allowedNames.has(name)) {
      add({
        code: "SURF-PROP-003",
        message: `Unknown property ${name} on ${subject}.`,
        element: entry,
        declaration: subject.includes(".") ? subject : undefined,
        suggestion: allowed.length === 0
          ? "Remove the property."
          : `Use only these properties: ${allowed.join(", ")}.`,
      });
    }

    const expectedType = propertyTypes[name] ?? "string";
    if (!isPropertyType(entry.getValue(), expectedType)) {
      add({
        code: "SURF-PROP-004",
        message: `Property ${name} on ${subject} must be ${
          propertyTypeDescription(expectedType)
        }.`,
        element: entry,
        declaration: subject.includes(".") ? subject : undefined,
        suggestion: `Use ${propertyTypeExample(name, expectedType)}.`,
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
        suggestion: `Add ${
          propertyTypeExample(name, propertyTypes[name] ?? "string")
        } to the declaration.`,
      });
    }
  }
}

function isPropertyType(value: Primitive, expected: PropertyType): boolean {
  switch (expected) {
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
  }
}

function propertyTypeDescription(type: PropertyType): string {
  switch (type) {
    case "string":
      return "a string";
    case "boolean":
      return "a Boolean";
  }
}

function propertyTypeExample(name: string, type: PropertyType): string {
  switch (type) {
    case "string":
      return `${name}="..."`;
    case "boolean":
      return `${name}=#true or ${name}=#false`;
  }
}

function validateNoChildren(
  node: Node,
  subject: string,
  add: AddDiagnostic,
): void {
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

function validateNoTag(
  node: Node,
  add: AddDiagnostic,
  declaration?: string,
): void {
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

function validateReferenceNode(
  node: Node,
  expectedType: string,
  subject: string,
  declaration: string,
  add: AddDiagnostic,
): void {
  validateArguments(node, 1, subject, add, true);

  if (node.getTag() !== null) {
    add({
      code: "SURF-TAG-001",
      message: `Type annotations are not supported on ${node.getName()} nodes.`,
      element: node,
      declaration,
      suggestion:
        `Move the annotation to the referenced string: (${expectedType})"id".`,
    });
  }

  const reference = node.getArgumentEntry(0);
  const actualType = reference?.getTag() ?? null;
  if (actualType !== expectedType) {
    add({
      code: "SURF-REF-003",
      message: actualType === null
        ? `${subject} must annotate its reference as ${expectedType}.`
        : `${subject} expects a ${expectedType} reference but found ${actualType}.`,
      element: reference ?? node,
      declaration,
      suggestion: `Use ${node.getName()} (${expectedType})"${expectedType}Id".`,
    });
  }

  for (const entry of node.getArgumentEntries().slice(1)) {
    if (entry.getTag() !== null) {
      add({
        code: "SURF-TAG-001",
        message:
          `Only the reference argument on ${node.getName()} may have a type annotation.`,
        element: entry,
        declaration,
        suggestion: "Remove the additional KDL type annotation.",
      });
    }
  }
}

function validateIdentity(
  node: Node,
  identities: Set<string>,
  add: AddDiagnostic,
): void {
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

function validateReferences(
  surfaceNodes: Node[],
  applications: Node[],
  entities: Node[],
  queries: Node[],
  interfaces: Node[],
  screens: Node[],
  add: AddDiagnostic,
): void {
  const entitiesById = nodesByIdentifier(entities);
  for (const query of queries) {
    validateQueryReferences(query, entitiesById, add);
  }

  for (const screen of screens) {
    validateScreenReferences(screen, nodesByIdentifier(interfaces), add);
  }

  const declarationsByType = new Map<string, Map<string, Node>>([
    ["application", nodesByIdentifier(applications)],
    ["entity", entitiesById],
    ["interface", nodesByIdentifier(interfaces)],
    ["query", nodesByIdentifier(queries)],
    ["screen", nodesByIdentifier(screens)],
  ]);
  for (
    const node of [
      ...surfaceNodes,
      ...applications,
      ...entities,
      ...queries,
      ...interfaces,
      ...screens,
    ]
  ) {
    const privateEntities = node.getName() === "query"
      ? nodesByIdentifier(
        (node.children?.nodes ?? []).filter((child) => child.getName() === "entity"),
      )
      : undefined;
    validateContextReferences(
      node,
      declarationName(node),
      declarationsByType,
      privateEntities,
      add,
    );
  }
}

function validateContextReferences(
  node: Node,
  declaration: string,
  declarationsByType: Map<string, Map<string, Node>>,
  privateEntities: Map<string, Node> | undefined,
  add: AddDiagnostic,
): void {
  if (node.getName() === "context") {
    for (const reference of node.getArgumentEntries().slice(0, -1)) {
      const id = reference.getValue();
      const type = reference.getTag();
      if (
        typeof id !== "string" || type === null ||
        !CONTEXT_REFERENCE_TYPES.has(type)
      ) {
        continue;
      }
      const resolved = type === "entity"
        ? privateEntities?.get(id) ?? declarationsByType.get(type)?.get(id)
        : declarationsByType.get(type)?.get(id);
      if (resolved === undefined) {
        add({
          code: "SURF-REF-001",
          message: `Unresolved ${type} reference ${id} in context.`,
          element: reference,
          declaration,
          suggestion:
            `Declare ${type} "${id}" in the visible scope or change the reference.`,
        });
      }
    }
    return;
  }

  for (const child of node.children?.nodes ?? []) {
    validateContextReferences(
      child,
      declaration,
      declarationsByType,
      privateEntities,
      add,
    );
  }
}

function validateQueryReferences(
  query: Node,
  entitiesById: Map<string, Node>,
  add: AddDiagnostic,
): void {
  const declaration = declarationName(query);
  const children = query.children?.nodes ?? [];
  const localEntities = children.filter((child) => child.getName() === "entity");
  const localEntitiesById = nodesByIdentifier(localEntities);

  for (const entity of localEntities) {
    const id = entity.getArgument(0);
    if (typeof id === "string" && entitiesById.has(id)) {
      add({
        code: "SURF-ID-003",
        message: `${declaration} private entity ${id} conflicts with a global entity.`,
        element: entity.getArgumentEntry(0),
        declaration,
        suggestion: "Rename the private entity so its ID is unique.",
      });
    }
  }

  const references = children.filter((child) =>
    child.getName() === "input" || child.getName() === "returns"
  );
  for (const reference of references) {
    const entityId = reference.getArgument(0);
    if (
      typeof entityId === "string" &&
      !localEntitiesById.has(entityId) && !entitiesById.has(entityId)
    ) {
      add({
        code: "SURF-REF-001",
        message:
          `Unresolved entity reference ${entityId} in ${declaration}.${reference.getName()}.`,
        element: reference.getArgumentEntry(0),
        declaration,
        suggestion:
          `Declare entity "${entityId}" globally or inside ${declaration}, or change the reference.`,
      });
    }
  }
}

function validateScreenReferences(
  screen: Node,
  interfacesById: Map<string, Node>,
  add: AddDiagnostic,
): void {
  const declaration = declarationName(screen);
  const interfaceUse = (screen.children?.nodes ?? []).find(
    (child) => child.getName() === "use",
  );
  const interfaceReference = interfaceUse?.getArgumentEntry(0);
  if (interfaceReference?.getTag() !== "interface") {
    return;
  }
  const interfaceId = interfaceReference.getValue();
  if (typeof interfaceId !== "string" || interfacesById.has(interfaceId)) {
    return;
  }
  add({
    code: "SURF-REF-001",
    message: `Unresolved interface reference ${interfaceId} on ${declaration}.`,
    element: interfaceReference,
    declaration,
    suggestion: `Declare interface "${interfaceId}" or change the screen use.`,
  });
}

function nodesByIdentifier(nodes: Node[]): Map<string, Node> {
  const result = new Map<string, Node>();
  for (const node of nodes) {
    const id = node.getArgument(0);
    if (typeof id === "string" && !result.has(id)) {
      result.set(id, node);
    }
  }
  return result;
}

function declarationName(node: Node): string {
  const id = node.getArgument(0);
  return typeof id === "string" ? `${node.getName()}.${id}` : node.getName();
}

function buildIr(document: Document): SurfaceIr {
  const version = expectNode(document.findNodeByName("surface"), "surface");
  const application = expectNode(
    document.findNodeByName("application"),
    "application",
  );
  const applicationChildren = expectChildren(application, "application");
  const purpose = expectNode(
    applicationChildren.findNodeByName("purpose"),
    "application purpose",
  );
  const entities = document.nodes.filter((node) => node.getName() === "entity");
  const queries = document.nodes.filter((node) => node.getName() === "query");
  const interfaces = document.nodes.filter(
    (node) => node.getName() === "interface",
  );
  const screens = document.nodes.filter((node) => node.getName() === "screen");

  return {
    surfaceVersion: expectString(version.getArgument(0), "Surface version"),
    application: {
      id: expectString(application.getArgument(0), "application identifier"),
      purpose: expectString(purpose.getArgument(0), "application purpose"),
    },
    ...(entities.length === 0 ? {} : {
      entities: entities.map(buildEntityIr),
    }),
    ...(queries.length === 0 ? {} : {
      queries: queries.map((query) => {
        const children = expectChildren(query, "query");
        const localEntities = children.findNodesByName("entity");
        const inputNode = children.findNodeByName("input");
        const returnsNode = expectNode(
          children.findNodeByName("returns"),
          "query returns",
        );
        return {
          id: expectString(query.getArgument(0), "query identifier"),
          ...(localEntities.length === 0 ? {} : {
            entities: localEntities.map(buildEntityIr),
          }),
          ...(inputNode === undefined ? {} : {
            input: {
              entity: expectString(
                inputNode.getArgument(0),
                "input entity",
              ),
            },
          }),
          returns: {
            entity: expectString(
              returnsNode.getArgument(0),
              "return entity",
            ),
          },
        };
      }),
    }),
    ...(interfaces.length === 0 ? {} : {
      interfaces: interfaces.map((interfaceNode) => ({
        id: expectString(
          interfaceNode.getArgument(0),
          "interface identifier",
        ),
      })),
    }),
    screens: screens.map((screen) => {
      const route = optionalString(screen.getProperty("route"), "screen route");
      const screenChildren = expectChildren(screen, "screen");
      const interfaceUse = screenChildren.findNodeByName("use");
      const interfaceId = interfaceUse === undefined
        ? undefined
        : expectString(interfaceUse.getArgument(0), "screen interface");
      return {
        id: expectString(screen.getArgument(0), "screen identifier"),
        ...(route === undefined ? {} : { route }),
        ...(interfaceId === undefined ? {} : { interface: interfaceId }),
      };
    }),
  };
}

function buildEntityIr(entity: Node): SurfaceEntityIr {
  const children = expectChildren(entity, "entity");
  return {
    id: expectString(entity.getArgument(0), "entity identifier"),
    fields: children.nodes.filter(isEntityFieldNode).map((field) => {
      const modifiers = new Set(field.getArguments());
      const optional = modifiers.has("optional") ? true : undefined;
      return {
        name: field.getName(),
        type: expectPrimitiveType(
          field.getTag() ?? undefined,
          "field type",
        ),
        ...(optional === undefined ? {} : { optional }),
      };
    }),
  };
}

function expectNode(node: Node | undefined, subject: string): Node {
  if (node === undefined) {
    throw new Error(`Validated Surface document is missing ${subject}.`);
  }
  return node;
}

function expectChildren(node: Node, subject: string): Document {
  if (node.children === null) {
    throw new Error(`Validated ${subject} is missing its child block.`);
  }
  return node.children;
}

function expectString(
  value: Primitive | undefined,
  subject: string,
): string {
  if (typeof value !== "string") {
    throw new Error(`Validated ${subject} is not a string.`);
  }
  return value;
}

function expectPrimitiveType(
  value: Primitive | undefined,
  subject: string,
): PrimitiveType {
  const type = expectString(value, subject);
  if (!PRIMITIVE_TYPES.has(type as PrimitiveType)) {
    throw new Error(`Validated ${subject} is not a primitive type.`);
  }
  return type as PrimitiveType;
}

function optionalString(
  value: Primitive | undefined,
  subject: string,
): string | undefined {
  return value === undefined ? undefined : expectString(value, subject);
}
