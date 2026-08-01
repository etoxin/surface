const base = new URL("../../", import.meta.url);
const routes: Record<string, { file: string; contentType: string }> = {
  "/": {
    file: "builds/03-controller/index.html",
    contentType: "text/html; charset=utf-8",
  },
  "/assets/govuk-frontend.min.css": {
    file: "vendor/govuk-frontend-6.4.0/govuk-frontend.min.css",
    contentType: "text/css; charset=utf-8",
  },
};

export function createApp(): (request: Request) => Promise<Response> {
  const cache = new Map<string, Uint8Array>();
  return async (request) => {
    const route = request.method === "GET"
      ? routes[new URL(request.url).pathname]
      : undefined;
    if (!route) return new Response("Not found", { status: 404 });
    let body = cache.get(route.file);
    if (!body) {
      body = await Deno.readFile(new URL(route.file, base));
      cache.set(route.file, body);
    }
    return new Response(new Uint8Array(body).buffer, {
      headers: { "content-type": route.contentType },
    });
  };
}

if (import.meta.main) {
  console.log("Design consistency build 03: http://localhost:8022/");
  Deno.serve({ port: 8022 }, createApp());
}
