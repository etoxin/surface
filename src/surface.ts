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
    missing: null;
  };
}

export interface SurfaceScreenIr {
  id: string;
  route?: string;
  query?: string;
  sections: SurfaceSectionIr[];
  states?: SurfaceStateIr[];
}

export interface SurfaceSectionIr {
  name: string;
  title?: string;
  text: string[];
  fields?: string[];
}

export interface SurfaceStateIr {
  id: string;
  sections: SurfaceSectionIr[];
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
type PropertyType = "string" | "boolean" | "null";

const IDENTIFIER_PATTERN = /^[a-z][A-Za-z0-9]*$/;
const PRIMITIVE_TYPES = new Set<PrimitiveType>(["string", "boolean"]);
const FIELD_MODIFIERS = new Set(["optional"]);
const TOP_LEVEL_NODES = new Set([
  "surface",
  "application",
  "entity",
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
          "Use only surface, application, entity, query, and screen nodes in Surface 0.1.",
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
      suggestion: "Add a screen with at least one section.",
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

  for (const screen of screens) {
    validateScreen(screen, add);
    validateIdentity(screen, identities, add);
  }

  validateReferences(entities, queries, screens, add);

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
      suggestion: 'Add returns (entity)"entityId" missing=#null exactly once.',
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
  validateProperties(
    node,
    ["missing"],
    subject,
    add,
    ["missing"],
    { missing: "null" },
  );
  validateOnlyContextChildren(node, subject, add);
}

function validateScreen(node: Node, add: AddDiagnostic): void {
  const declaration = declarationName(node);
  validateArguments(node, 1, declaration, add, true);
  validateProperties(node, ["route"], declaration, add);

  const children = node.children?.nodes ?? [];
  const uses = children.filter((child) => child.getName() === "use");
  const sections = children.filter((child) => child.getName() === "section");
  const states = children.filter((child) => child.getName() === "state");
  for (const child of children) {
    if (child.getName() === "context") {
      validateContextNode(child, declaration, add);
      continue;
    }

    if (
      child.getName() !== "use" && child.getName() !== "section" &&
      child.getName() !== "state"
    ) {
      add({
        code: "SURF-CHILD-002",
        message: `Unknown child node ${child.getName()} in ${declaration}.`,
        element: child,
        declaration,
        suggestion:
          "Use only use, section, state, and context child nodes in a screen.",
      });
    }
  }

  if (uses.length > 1) {
    add({
      code: "SURF-CHILD-005",
      message: `${declaration} may contain at most one use child node.`,
      element: uses[1],
      declaration,
      suggestion: "Keep no more than one use (query) reference.",
    });
  }

  for (const use of uses) {
    validateUse(use, declaration, add);
  }

  if (sections.length === 0) {
    add({
      code: "SURF-CHILD-003",
      message: `${declaration} must contain at least one section child node.`,
      element: node,
      declaration,
      suggestion: 'Add a section such as section "Home" { text "Hello, world!" }.',
    });
  }

  for (const section of sections) {
    validateSection(section, declaration, add);
  }

  const stateIdentities = new Set<string>();
  for (const state of states) {
    validateState(state, declaration, add);
    validateIdentity(state, stateIdentities, add);
  }

  if (uses.length === 0 && states.length > 0) {
    add({
      code: "SURF-STATE-002",
      message: `${declaration} cannot contain states without a query.`,
      element: states[0],
      declaration,
      suggestion: 'Add use (query)"queryId" to the screen or remove its states.',
    });
  }
}

function validateUse(
  node: Node,
  declaration: string,
  add: AddDiagnostic,
): void {
  const subject = `${declaration}.use`;
  validateReferenceNode(node, "query", subject, declaration, add);
  validateProperties(node, [], subject, add);
  validateOnlyContextChildren(node, subject, add);
}

function validateState(
  node: Node,
  declaration: string,
  add: AddDiagnostic,
): void {
  const id = node.getArgument(0);
  const subject = typeof id === "string"
    ? `${declaration}.state.${id}`
    : `${declaration}.state`;
  validateNoTag(node, add, declaration);
  validateArguments(node, 1, subject, add, true);
  validateProperties(node, [], subject, add);

  if (
    typeof id === "string" && id !== "empty" && id !== "notFound"
  ) {
    add({
      code: "SURF-STATE-003",
      message: `Unsupported screen state ${id}.`,
      element: node.getArgumentEntry(0),
      declaration,
      suggestion: "Use only empty and notFound states in Surface 0.1.",
    });
  }

  const children = node.children?.nodes ?? [];
  const sections = children.filter((child) => child.getName() === "section");
  for (const child of children) {
    if (child.getName() === "context") {
      validateContextNode(child, subject, add);
      continue;
    }

    if (child.getName() !== "section") {
      add({
        code: "SURF-CHILD-002",
        message: `Unknown child node ${child.getName()} in ${subject}.`,
        element: child,
        declaration,
        suggestion: "Use only section and context child nodes in a state.",
      });
    }
  }

  if (sections.length === 0) {
    add({
      code: "SURF-CHILD-003",
      message: `${subject} must contain at least one section child node.`,
      element: node,
      declaration,
      suggestion: "Add a section with text describing the state.",
    });
  }

  for (const section of sections) {
    validateSection(section, subject, add, false);
  }
}

function validateSection(
  node: Node,
  declaration: string,
  add: AddDiagnostic,
  allowFields = true,
): void {
  const name = node.getArgument(0);
  const subject = typeof name === "string"
    ? `${declaration}.section.${name}`
    : `${declaration}.section`;

  validateNoTag(node, add, declaration);
  validateArguments(node, 1, subject, add);
  validateProperties(node, [], subject, add);

  if (name !== undefined && typeof name !== "string") {
    add({
      code: "SURF-ARG-002",
      message: "Section must contain one string name.",
      element: node.getArgumentEntry(0),
      declaration,
      suggestion: 'Write section followed by one quoted name, such as "Home".',
    });
  }

  const children = node.children?.nodes ?? [];
  const titles = children.filter((child) => child.getName() === "title");
  const textNodes = children.filter((child) => child.getName() === "text");
  const fields = children.filter((child) => child.getName() === "field");

  for (const child of children) {
    if (child.getName() === "context") {
      validateContextNode(child, subject, add);
      continue;
    }

    if (
      child.getName() !== "title" && child.getName() !== "text" &&
      (child.getName() !== "field" || !allowFields)
    ) {
      add({
        code: "SURF-CHILD-002",
        message: `Unknown child node ${child.getName()} in ${subject}.`,
        element: child,
        declaration,
        suggestion: allowFields
          ? "Use only title, text, field, and context child nodes in a section."
          : "Use only title, text, and context child nodes in a state section.",
      });
    }
  }

  if (titles.length > 1) {
    add({
      code: "SURF-CHILD-005",
      message: `${subject} may contain at most one title child node.`,
      element: titles[1],
      declaration,
      suggestion: "Keep no more than one title child node.",
    });
  }

  if (allowFields && textNodes.length > 0 && fields.length > 0) {
    add({
      code: "SURF-CHILD-006",
      message: `${subject} cannot mix text and field child nodes.`,
      element: fields[0],
      declaration,
      suggestion: "Use either ordered text or ordered field references in one section.",
    });
  }

  if (textNodes.length === 0 && (!allowFields || fields.length === 0)) {
    add({
      code: "SURF-CHILD-003",
      message: allowFields
        ? `${subject} must contain at least one text or field child node.`
        : `${subject} must contain at least one text child node.`,
      element: node,
      declaration,
      suggestion: allowFields
        ? 'Add text such as text "Hello, world!" or a field reference.'
        : 'Add text such as text "Describe this state.".',
    });
  }

  for (const title of titles) {
    validateLeafStringNode(title, "title", subject, add);
  }

  for (const text of textNodes) {
    validateLeafStringNode(text, "text", subject, add);
  }

  if (allowFields) {
    for (const field of fields) {
      validateFieldReference(field, subject, declaration, add);
    }
  }
}

function validateFieldReference(
  node: Node,
  subject: string,
  declaration: string,
  add: AddDiagnostic,
): void {
  validateNoTag(node, add, declaration);
  validateArguments(node, 1, `${subject}.field`, add, true);
  validateProperties(node, [], `${subject}.field`, add);
  validateOnlyContextChildren(node, `${subject}.field`, add);
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
  validateLeafStringNode(node, "context", declaration, add, false);
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
    case "null":
      return value === null;
  }
}

function propertyTypeDescription(type: PropertyType): string {
  switch (type) {
    case "string":
      return "a string";
    case "boolean":
      return "a Boolean";
    case "null":
      return "null";
  }
}

function propertyTypeExample(name: string, type: PropertyType): string {
  switch (type) {
    case "string":
      return `${name}="..."`;
    case "boolean":
      return `${name}=#true or ${name}=#false`;
    case "null":
      return `${name}=#null`;
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
  entities: Node[],
  queries: Node[],
  screens: Node[],
  add: AddDiagnostic,
): void {
  const entitiesById = nodesByIdentifier(entities);
  const queriesById = nodesByIdentifier(queries);

  for (const query of queries) {
    validateQueryReferences(query, entitiesById, add);
  }

  for (const screen of screens) {
    validateScreenReferences(screen, queriesById, entitiesById, add);
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

function resolveQueryEntity(
  query: Node,
  reference: Node | undefined,
  globalEntitiesById: Map<string, Node>,
): Node | undefined {
  const entityId = reference?.getArgument(0);
  if (typeof entityId !== "string") {
    return undefined;
  }

  const localEntities = (query.children?.nodes ?? []).filter(
    (child) => child.getName() === "entity",
  );
  return nodesByIdentifier(localEntities).get(entityId) ??
    globalEntitiesById.get(entityId);
}

function validateScreenReferences(
  screen: Node,
  queriesById: Map<string, Node>,
  entitiesById: Map<string, Node>,
  add: AddDiagnostic,
): void {
  const declaration = declarationName(screen);
  const queryUse = (screen.children?.nodes ?? []).find(
    (child) => child.getName() === "use",
  );
  const queryId = queryUse?.getArgument(0);
  const fieldReferences = (screen.children?.nodes ?? [])
    .filter((child) => child.getName() === "section")
    .flatMap((section) =>
      (section.children?.nodes ?? []).filter(
        (child) => child.getName() === "field",
      )
    );

  if (typeof queryId !== "string") {
    if (fieldReferences.length > 0) {
      add({
        code: "SURF-REF-001",
        message: `${declaration} contains field references but has no query.`,
        element: fieldReferences[0],
        declaration,
        suggestion:
          'Add use (query)"queryId" for a query that returns the referenced entity.',
      });
    }
    return;
  }

  const query = queriesById.get(queryId);
  if (query === undefined) {
    add({
      code: "SURF-REF-001",
      message: `Unresolved query reference ${queryId} on ${declaration}.`,
      element: queryUse?.getArgumentEntry(0),
      declaration,
      suggestion: `Declare query "${queryId}" or change the screen query.`,
    });
    return;
  }

  const states = (screen.children?.nodes ?? []).filter(
    (child) => child.getName() === "state",
  );
  const inputNode = (query.children?.nodes ?? []).find(
    (child) => child.getName() === "input",
  );
  const inputEntity = resolveQueryEntity(query, inputNode, entitiesById);
  const hasRequiredInput = (inputEntity?.children?.nodes ?? [])
    .filter(isEntityFieldNode)
    .some((field) => !field.getArguments().includes("optional"));
  const requiredStates = hasRequiredInput ? ["empty", "notFound"] : ["notFound"];
  for (const requiredState of requiredStates) {
    const matching = states.filter(
      (state) => state.getArgument(0) === requiredState,
    );
    if (matching.length !== 1) {
      add({
        code: "SURF-STATE-001",
        message:
          `${declaration} must contain exactly one ${requiredState} state for query.${queryId}.`,
        element: matching[1] ?? screen,
        declaration,
        suggestion:
          `Add state "${requiredState}" with at least one section, or remove the duplicate.`,
      });
    }
  }

  if (
    !hasRequiredInput &&
    states.some((state) => state.getArgument(0) === "empty")
  ) {
    add({
      code: "SURF-STATE-004",
      message:
        `${declaration} cannot contain an empty state because query.${queryId} has no required input fields.`,
      element: states.find((state) => state.getArgument(0) === "empty"),
      declaration,
      suggestion:
        "Remove the empty state or add a required field to the query input entity.",
    });
  }

  const returnsNode = query.children?.nodes.find(
    (child) => child.getName() === "returns",
  );
  const entityId = returnsNode?.getArgument(0);
  const entity = resolveQueryEntity(query, returnsNode, entitiesById);
  if (entity === undefined) {
    return;
  }

  const fieldNames = new Set(
    (entity.children?.nodes ?? [])
      .filter(isEntityFieldNode)
      .map((field) => field.getName()),
  );
  for (const field of fieldReferences) {
    const name = field.getArgument(0);
    if (typeof name === "string" && !fieldNames.has(name)) {
      add({
        code: "SURF-REF-001",
        message:
          `Unresolved field reference ${name} from entity.${entityId} on ${declaration}.`,
        element: field.getArgumentEntry(0),
        declaration,
        suggestion: `Use a field declared by entity "${entityId}".`,
      });
    }
  }
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
            missing: expectNull(
              returnsNode.getProperty("missing"),
              "return missing",
            ),
          },
        };
      }),
    }),
    screens: screens.map((screen) => {
      const route = optionalString(screen.getProperty("route"), "screen route");
      const screenChildren = expectChildren(screen, "screen");
      const queryUse = screenChildren.findNodeByName("use");
      const query = queryUse === undefined
        ? undefined
        : expectString(queryUse.getArgument(0), "screen query");
      const states = screenChildren.findNodesByName("state");
      return {
        id: expectString(screen.getArgument(0), "screen identifier"),
        ...(route === undefined ? {} : { route }),
        ...(query === undefined ? {} : { query }),
        sections: screenChildren.findNodesByName("section").map(buildSectionIr),
        ...(states.length === 0 ? {} : {
          states: states.map((state) => {
            const children = expectChildren(state, "state");
            return {
              id: expectString(state.getArgument(0), "state identifier"),
              sections: children
                .findNodesByName("section")
                .map(buildSectionIr),
            };
          }),
        }),
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

function buildSectionIr(section: Node): SurfaceSectionIr {
  const children = expectChildren(section, "section");
  const titleNode = children.findNodeByName("title");
  const title = titleNode === undefined
    ? undefined
    : expectString(titleNode.getArgument(0), "section title");
  const fields = children.findNodesByName("field").map((field) =>
    expectString(field.getArgument(0), "field reference")
  );
  return {
    name: expectString(section.getArgument(0), "section name"),
    ...(title === undefined ? {} : { title }),
    text: children.findNodesByName("text").map((text) =>
      expectString(text.getArgument(0), "section text")
    ),
    ...(fields.length === 0 ? {} : { fields }),
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

function expectNull(
  value: Primitive | undefined,
  subject: string,
): null {
  if (value !== null) {
    throw new Error(`Validated ${subject} is not null.`);
  }
  return null;
}

function optionalString(
  value: Primitive | undefined,
  subject: string,
): string | undefined {
  return value === undefined ? undefined : expectString(value, subject);
}
