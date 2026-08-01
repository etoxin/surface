import {
  createDevelopmentState,
  createProject,
  createWorkItem,
  DEVELOPMENT_USERS,
  listUserTenants,
  loadTenantWorkspace,
  setTenantMembership,
  type TenantRole,
  type TrackerState,
  updateProject,
  updateWorkItem,
  type WorkItemStatus,
} from "./domain.ts";

export const PORT = 8007;
export const UNAVAILABLE_RESPONSE = { error: "unavailable" } as const;

const PICO_STYLESHEET = new URL("./pico.min.css", import.meta.url);

export interface StartOptions {
  state?: TrackerState;
  port?: number;
}

export function createRequestHandler(
  state: TrackerState,
  html: string,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/assets/pico.min.css") {
      return new Response(await Deno.readFile(PICO_STYLESHEET), {
        headers: {
          "content-type": "text/css; charset=utf-8",
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy":
            "default-src 'self'; script-src 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'",
          "cache-control": "no-store",
        },
      });
    }

    if (!url.pathname.startsWith("/api/")) return unavailable();
    const actorUserId = authenticate(request);
    if (!actorUserId) {
      return json({ error: "authenticationRequired" }, 401);
    }

    try {
      if (request.method === "GET" && url.pathname === "/api/tenants") {
        return json(listUserTenants(state, { actorUserId }), 200);
      }

      const workspaceMatch = url.pathname.match(/^\/api\/tenants\/([^/]+)\/workspace$/);
      if (request.method === "GET" && workspaceMatch) {
        const tenantId = pathUuid(workspaceMatch[1]);
        const result = loadTenantWorkspace(state, { actorUserId, tenantId });
        return result ? json(result, 200) : unavailable();
      }

      const projectsMatch = url.pathname.match(/^\/api\/tenants\/([^/]+)\/projects$/);
      if (request.method === "POST" && projectsMatch) {
        const tenantId = pathUuid(projectsMatch[1]);
        const body = await readObject(request);
        const result = createProject(state, {
          actorUserId,
          tenantId,
          name: requiredString(body.name),
          ...optionalStringField(body, "description"),
        });
        return result ? json(result, 201) : unavailable();
      }

      const projectMatch = url.pathname.match(
        /^\/api\/tenants\/([^/]+)\/projects\/([^/]+)$/,
      );
      if (request.method === "PUT" && projectMatch) {
        const tenantId = pathUuid(projectMatch[1]);
        const projectId = pathUuid(projectMatch[2]);
        const body = await readObject(request);
        const result = updateProject(state, {
          actorUserId,
          tenantId,
          projectId,
          expectedVersion: integer(body.expectedVersion),
          name: requiredString(body.name),
          ...optionalStringField(body, "description"),
        });
        return result ? json(result, 200) : unavailable();
      }

      const workItemsMatch = url.pathname.match(
        /^\/api\/tenants\/([^/]+)\/work-items$/,
      );
      if (request.method === "POST" && workItemsMatch) {
        const tenantId = pathUuid(workItemsMatch[1]);
        const body = await readObject(request);
        const result = createWorkItem(state, {
          actorUserId,
          tenantId,
          projectId: uuid(body.projectId),
          title: requiredString(body.title),
          ...optionalUuidField(body, "assigneeUserId"),
        });
        return result ? json(result, 201) : unavailable();
      }

      const workItemMatch = url.pathname.match(
        /^\/api\/tenants\/([^/]+)\/work-items\/([^/]+)$/,
      );
      if (request.method === "PUT" && workItemMatch) {
        const tenantId = pathUuid(workItemMatch[1]);
        const workItemId = pathUuid(workItemMatch[2]);
        const body = await readObject(request);
        const result = updateWorkItem(state, {
          actorUserId,
          tenantId,
          workItemId,
          expectedVersion: integer(body.expectedVersion),
          title: requiredString(body.title),
          status: workItemStatus(body.status),
          ...optionalUuidField(body, "assigneeUserId"),
          clearAssignee: boolean(body.clearAssignee),
        });
        return result ? json(result, 200) : unavailable();
      }

      const membershipMatch = url.pathname.match(
        /^\/api\/tenants\/([^/]+)\/memberships\/([^/]+)$/,
      );
      if (request.method === "PUT" && membershipMatch) {
        const tenantId = pathUuid(membershipMatch[1]);
        const memberUserId = pathUuid(membershipMatch[2]);
        const body = await readObject(request);
        const result = setTenantMembership(state, {
          actorUserId,
          tenantId,
          memberUserId,
          role: tenantRole(body.role),
        });
        return result ? json(result, 200) : unavailable();
      }
      return unavailable();
    } catch (error) {
      if (error instanceof RequestError) {
        return json({ error: "invalidRequest" }, 400);
      }
      throw error;
    }
  };
}

export async function startServer(
  options: StartOptions = {},
): Promise<Deno.HttpServer> {
  const state = options.state ?? createDevelopmentState();
  const html = await Deno.readTextFile(new URL("./index.html", import.meta.url));
  const port = options.port ?? PORT;
  console.log(`Multi-tenant Project Tracker: http://localhost:${port}/`);
  return Deno.serve({ port }, createRequestHandler(state, html));
}

export function authenticate(request: Request): string | undefined {
  const alias = request.headers.get("x-dev-user") ?? "";
  return DEVELOPMENT_USERS[alias as keyof typeof DEVELOPMENT_USERS]?.id;
}

function unavailable(): Response {
  return json(UNAVAILABLE_RESPONSE, 404);
}

function json(value: unknown, status: number): Response {
  return Response.json(value, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function readObject(request: Request): Promise<Record<string, unknown>> {
  if (
    !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")
  ) {
    throw new RequestError();
  }
  const value: unknown = await request.json().catch(() => {
    throw new RequestError();
  });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestError();
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string") throw new RequestError();
  return value;
}

function optionalStringField(
  object: Record<string, unknown>,
  key: string,
): { description?: string } {
  if (!(key in object)) return {};
  if (typeof object[key] !== "string") throw new RequestError();
  return { description: object[key] };
}

function optionalUuidField(
  object: Record<string, unknown>,
  key: string,
): { assigneeUserId?: string } {
  if (!(key in object)) return {};
  return { assigneeUserId: uuid(object[key]) };
}

function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) throw new RequestError();
  return value;
}

function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new RequestError();
  return value;
}

function uuid(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) throw new RequestError();
  return value;
}

function pathUuid(value: string): string {
  try {
    return uuid(decodeURIComponent(value));
  } catch {
    throw new RequestError();
  }
}

function tenantRole(value: unknown): TenantRole {
  if (
    value !== "owner" && value !== "administrator" &&
    value !== "contributor" && value !== "viewer"
  ) throw new RequestError();
  return value;
}

function workItemStatus(value: unknown): WorkItemStatus {
  if (value !== "backlog" && value !== "active" && value !== "done") {
    throw new RequestError();
  }
  return value;
}

class RequestError extends Error {}

if (import.meta.main) await startServer();
