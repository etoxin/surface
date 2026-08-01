const SIGNUP_PAGE = await Deno.readTextFile(new URL("./index.html", import.meta.url));

type FieldName = "email" | "password" | "confirmPassword" | "acceptedTerms";
type Input = Record<FieldName, string | boolean> & {
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};
interface ErrorDetail {
  field: FieldName;
  message: string;
}

class SignupApplication {
  readonly #accounts = new Set<string>();

  async handle(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === "GET" && pathname === "/") {
      return new Response(SIGNUP_PAGE, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (request.method !== "POST" || pathname !== "/register") {
      return Response.json({ error: "notFound" }, { status: 404 });
    }

    const input = await this.#decode(request);
    if (!input) return Response.json({ error: "invalidRequest" }, { status: 400 });
    const email = input.email.trim().toLowerCase();
    const errors = this.#validate({ ...input, email });
    if (errors.length) {
      return Response.json(
        { httpStatus: 422, status: "invalid", errors },
        { status: 422 },
      );
    }
    if (this.#accounts.has(email)) {
      const conflict: ErrorDetail = {
        field: "email",
        message: "An account already exists for this email.",
      };
      return Response.json(
        { httpStatus: 409, status: "conflict", errors: [conflict] },
        { status: 409 },
      );
    }

    const accountId = crypto.randomUUID();
    this.#accounts.add(email);
    return Response.json(
      { httpStatus: 201, status: "success", accountId },
      { status: 201 },
    );
  }

  #validate(input: Input): ErrorDetail[] {
    const checks: Array<[FieldName, boolean, string]> = [
      [
        "email",
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email),
        "Enter a valid email address.",
      ],
      [
        "password",
        input.password.length >= 12 && /[A-Z]/.test(input.password) &&
        /[a-z]/.test(input.password) && /[0-9]/.test(input.password),
        "Use at least 12 characters with uppercase, lowercase, and a number.",
      ],
      [
        "confirmPassword",
        input.confirmPassword === input.password,
        "Passwords must match.",
      ],
      ["acceptedTerms", input.acceptedTerms, "Accept the terms to continue."],
    ];
    return checks.flatMap(([field, valid, message]) =>
      valid ? [] : [{ field, message }]
    );
  }

  async #decode(request: Request): Promise<Input | null> {
    try {
      const body: unknown = await request.json();
      if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
      const data = body as Record<string, unknown>;
      if (
        typeof data.email !== "string" || typeof data.password !== "string" ||
        typeof data.confirmPassword !== "string" ||
        typeof data.acceptedTerms !== "boolean"
      ) return null;
      return data as Input;
    } catch {
      return null;
    }
  }
}

export function createApp(): (request: Request) => Promise<Response> {
  const application = new SignupApplication();
  return (request) => application.handle(request);
}

if (import.meta.main) {
  console.log("Signup determinism build 02: http://localhost:8011/");
  Deno.serve({ port: 8011 }, createApp());
}
