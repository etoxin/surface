import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

export const SHORT_LINK_BASE_URL = "https://sho.rt";
export const DEVELOPMENT_CREDENTIAL = "Bearer surface-development-credential";

const DEFAULT_PORT = 8004;
const GENERATED_SLUG_ATTEMPTS = 8;

export interface ShortLink {
  id: string;
  destination: string;
  slug: string;
  shortUrl: string;
  createdAt: string;
  protected: boolean;
}

export interface CreateShortLinkInput {
  destination: string;
  customSlug?: string;
  authorization: string;
}

export interface CreateShortLinkResult extends Partial<ShortLink> {
  httpStatus: number;
  error?: string;
}

export interface ResolveShortLinkInput {
  slug: string;
  authorization?: string;
}

export interface ResolveShortLinkResult {
  httpStatus: number;
  location?: string;
  error?: string;
}

export interface ShortLinkStore {
  findBySlug(slug: string): ShortLink | undefined;
  insert(link: ShortLink): boolean;
}

interface CreateDependencies {
  createId?: () => string;
  createSlug?: () => string;
  now?: () => Date;
}

interface ShortLinkRow {
  id: string;
  destination: string;
  slug: string;
  short_url: string;
  created_at: string;
  protected: number;
}

export class SqliteShortLinkStore implements ShortLinkStore {
  readonly #database: DatabaseSync;

  constructor(path: string) {
    this.#database = new DatabaseSync(path);
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS short_links (
        id TEXT PRIMARY KEY,
        destination TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        short_url TEXT NOT NULL,
        created_at TEXT NOT NULL,
        protected INTEGER NOT NULL CHECK (protected IN (0, 1))
      )
    `);
  }

  findBySlug(slug: string): ShortLink | undefined {
    const row = this.#database.prepare(`
      SELECT id, destination, slug, short_url, created_at, protected
      FROM short_links
      WHERE slug = ?
    `).get(slug) as ShortLinkRow | undefined;

    return row === undefined ? undefined : {
      id: row.id,
      destination: row.destination,
      slug: row.slug,
      shortUrl: row.short_url,
      createdAt: row.created_at,
      protected: row.protected === 1,
    };
  }

  insert(link: ShortLink): boolean {
    const result = this.#database.prepare(`
      INSERT OR IGNORE INTO short_links
        (id, destination, slug, short_url, created_at, protected)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      link.id,
      link.destination,
      link.slug,
      link.shortUrl,
      link.createdAt,
      link.protected ? 1 : 0,
    );

    return result.changes === 1;
  }

  close(): void {
    this.#database.close();
  }
}

export function createShortLink(
  input: CreateShortLinkInput,
  store: ShortLinkStore,
  dependencies: CreateDependencies = {},
): CreateShortLinkResult {
  if (!hasValidCredential(input.authorization)) {
    return { httpStatus: 401, error: "Unauthorized" };
  }

  const destination = parseUrl(input.destination);
  if (destination === undefined) {
    return { httpStatus: 400, error: "Destination must be a valid URL" };
  }

  const createId = dependencies.createId ?? (() => crypto.randomUUID());
  const createSlug = dependencies.createSlug ?? generateSlug;
  const now = dependencies.now ?? (() => new Date());
  const requestedSlug = input.customSlug;

  if (
    requestedSlug !== undefined &&
    store.findBySlug(requestedSlug) !== undefined
  ) {
    return { httpStatus: 409, error: "Slug already exists" };
  }

  for (let attempt = 0; attempt < GENERATED_SLUG_ATTEMPTS; attempt += 1) {
    const slug = requestedSlug ?? createSlug();
    const link: ShortLink = {
      id: createId(),
      destination,
      slug,
      shortUrl: `${SHORT_LINK_BASE_URL}/${encodeURIComponent(slug)}`,
      createdAt: now().toISOString(),
      protected: false,
    };

    if (store.insert(link)) {
      return { httpStatus: 201, ...link };
    }

    if (requestedSlug !== undefined) {
      return { httpStatus: 409, error: "Slug already exists" };
    }
  }

  return { httpStatus: 500, error: "Unable to generate a unique slug" };
}

export function resolveShortLink(
  input: ResolveShortLinkInput,
  store: ShortLinkStore,
): ResolveShortLinkResult {
  const link = store.findBySlug(input.slug);
  if (link === undefined) {
    return { httpStatus: 404, error: "Short link not found" };
  }

  if (link.protected && input.authorization === undefined) {
    return { httpStatus: 401, error: "Authorization required" };
  }

  if (link.protected && !hasValidCredential(input.authorization)) {
    return { httpStatus: 403, error: "Forbidden" };
  }

  return { httpStatus: 302, location: link.destination };
}

export async function handleShortLinkRequest(
  request: Request,
  store: ShortLinkStore,
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "POST" && url.pathname === "/links") {
    const authorization = request.headers.get("authorization") ?? "";
    if (!hasValidCredential(authorization)) {
      return jsonResponse({ httpStatus: 401, error: "Unauthorized" }, 401);
    }

    const body = await readJsonObject(request);
    if (
      body === undefined || typeof body.destination !== "string" ||
      (body.customSlug !== undefined && typeof body.customSlug !== "string")
    ) {
      return jsonResponse(
        { httpStatus: 400, error: "Invalid JSON request body" },
        400,
      );
    }

    const result = createShortLink(
      {
        destination: body.destination,
        customSlug: body.customSlug as string | undefined,
        authorization,
      },
      store,
    );
    return jsonResponse(result, result.httpStatus);
  }

  const slug = request.method === "GET" ? readSlug(url.pathname) : undefined;
  if (slug !== undefined) {
    const authorization = request.headers.get("authorization") ?? undefined;
    const result = resolveShortLink({ slug, authorization }, store);
    const headers = result.location === undefined
      ? undefined
      : { location: result.location };
    return jsonResponse(result, result.httpStatus, headers);
  }

  return jsonResponse({ httpStatus: 404, error: "Not found" }, 404);
}

export function createRequestHandler(
  store: ShortLinkStore,
): (request: Request) => Promise<Response> {
  return (request) => handleShortLinkRequest(request, store);
}

function hasValidCredential(value: string | undefined): boolean {
  return value === DEVELOPMENT_CREDENTIAL;
}

function parseUrl(value: string): string | undefined {
  try {
    return new URL(value).href;
  } catch {
    return undefined;
  }
}

function generateSlug(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 10);
}

function readSlug(pathname: string): string | undefined {
  const encodedSlug = pathname.slice(1);
  if (!pathname.startsWith("/") || encodedSlug.includes("/")) {
    return undefined;
  }

  try {
    return decodeURIComponent(encodedSlug);
  } catch {
    return undefined;
  }
}

async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | undefined> {
  try {
    const value: unknown = await request.json();
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

function jsonResponse(
  body: CreateShortLinkResult | ResolveShortLinkResult,
  status: number,
  extraHeaders?: HeadersInit,
): Response {
  const headers = new Headers(extraHeaders);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

if (import.meta.main) {
  const databasePath = fileURLToPath(
    new URL("../short-links.sqlite", import.meta.url),
  );
  const store = new SqliteShortLinkStore(databasePath);
  console.log(`URL Shortener API: http://localhost:${DEFAULT_PORT}`);
  Deno.serve({ port: DEFAULT_PORT }, createRequestHandler(store));
}
