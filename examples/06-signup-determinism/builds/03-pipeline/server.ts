const DOCUMENT = await Deno.readTextFile(new URL("./index.html", import.meta.url));

interface Candidate {
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}
interface Problem {
  field: keyof Candidate;
  message: string;
}
interface Rule {
  field: keyof Candidate;
  accepts(candidate: Candidate): boolean;
  message: string;
}

const RULES: Rule[] = [
  {
    field: "email",
    accepts: ({ email }) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    message: "Enter a valid email address.",
  },
  {
    field: "password",
    accepts: ({ password }) =>
      password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) &&
      /[0-9]/.test(password),
    message: "Use at least 12 characters with uppercase, lowercase, and a number.",
  },
  {
    field: "confirmPassword",
    accepts: ({ password, confirmPassword }) => password === confirmPassword,
    message: "Passwords must match.",
  },
  {
    field: "acceptedTerms",
    accepts: ({ acceptedTerms }) => acceptedTerms,
    message: "Accept the terms to continue.",
  },
];

export function createApp(): (request: Request) => Promise<Response> {
  const registeredEmails = new Set<string>();

  return async (request) => {
    const route = `${request.method} ${new URL(request.url).pathname}`;
    if (route === "GET /") {
      return new Response(DOCUMENT, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (route !== "POST /register") {
      return Response.json({ error: "notFound" }, { status: 404 });
    }

    const candidate = normalize(await decode(request));
    if (candidate === null) {
      return Response.json({ error: "invalidRequest" }, { status: 400 });
    }
    const errors = RULES.reduce<Problem[]>((result, rule) => {
      if (!rule.accepts(candidate)) {
        result.push({ field: rule.field, message: rule.message });
      }
      return result;
    }, []);
    if (errors.length > 0) {
      return reply(422, { httpStatus: 422, status: "invalid", errors });
    }
    if (registeredEmails.has(candidate.email)) {
      return reply(409, {
        httpStatus: 409,
        status: "conflict",
        errors: [{
          field: "email",
          message: "An account already exists for this email.",
        }],
      });
    }

    const accountId = crypto.randomUUID();
    registeredEmails.add(candidate.email);
    return reply(201, { httpStatus: 201, status: "success", accountId });
  };
}

async function decode(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function normalize(body: Record<string, unknown> | null): Candidate | null {
  if (
    body === null || typeof body.email !== "string" ||
    typeof body.password !== "string" || typeof body.confirmPassword !== "string" ||
    typeof body.acceptedTerms !== "boolean"
  ) return null;
  return {
    email: body.email.trim().toLowerCase(),
    password: body.password,
    confirmPassword: body.confirmPassword,
    acceptedTerms: body.acceptedTerms,
  };
}

function reply(status: number, body: unknown): Response {
  return Response.json(body, { status });
}

if (import.meta.main) {
  console.log("Signup determinism build 03: http://localhost:8012/");
  Deno.serve({ port: 8012 }, createApp());
}
