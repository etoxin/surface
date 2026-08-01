const PAGE = await Deno.readTextFile(new URL("./index.html", import.meta.url));

interface SignupInput {
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

interface FieldError {
  field: keyof SignupInput;
  message: string;
}

type SignupResult =
  | { httpStatus: 201; status: "success"; accountId: string }
  | { httpStatus: 409 | 422; status: "conflict" | "invalid"; errors: FieldError[] };

const EMAIL_MESSAGE = "Enter a valid email address.";
const PASSWORD_MESSAGE =
  "Use at least 12 characters with uppercase, lowercase, and a number.";

export function createApp(): (request: Request) => Promise<Response> {
  const accounts = new Map<string, { id: string; createdAt: string }>();

  return async (request) => {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(PAGE, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (request.method !== "POST" || url.pathname !== "/register") {
      return json({ error: "notFound" }, 404);
    }

    const input = await readInput(request);
    if (input === null) return json({ error: "invalidRequest" }, 400);

    const result = register(input, accounts);
    return json(result, result.httpStatus);
  };
}

function register(
  input: SignupInput,
  accounts: Map<string, { id: string; createdAt: string }>,
): SignupResult {
  const email = input.email.trim().toLowerCase();
  const errors: FieldError[] = [];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: "email", message: EMAIL_MESSAGE });
  }
  if (
    input.password.length < 12 || !/[A-Z]/.test(input.password) ||
    !/[a-z]/.test(input.password) || !/[0-9]/.test(input.password)
  ) {
    errors.push({ field: "password", message: PASSWORD_MESSAGE });
  }
  if (input.confirmPassword !== input.password) {
    errors.push({ field: "confirmPassword", message: "Passwords must match." });
  }
  if (!input.acceptedTerms) {
    errors.push({ field: "acceptedTerms", message: "Accept the terms to continue." });
  }
  if (errors.length > 0) return { httpStatus: 422, status: "invalid", errors };
  if (accounts.has(email)) {
    return {
      httpStatus: 409,
      status: "conflict",
      errors: [{
        field: "email",
        message: "An account already exists for this email.",
      }],
    };
  }

  const id = crypto.randomUUID();
  accounts.set(email, { id, createdAt: new Date().toISOString() });
  return { httpStatus: 201, status: "success", accountId: id };
}

async function readInput(request: Request): Promise<SignupInput | null> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
    const value = body as Record<string, unknown>;
    return typeof value.email === "string" && typeof value.password === "string" &&
        typeof value.confirmPassword === "string" &&
        typeof value.acceptedTerms === "boolean"
      ? value as unknown as SignupInput
      : null;
  } catch {
    return null;
  }
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

if (import.meta.main) {
  console.log("Signup determinism build 01: http://localhost:8010/");
  Deno.serve({ port: 8010 }, createApp());
}
