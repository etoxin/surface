const root = new URL("../../", import.meta.url);
const html = await Deno.readTextFile(
  new URL("builds/01-render-functions/index.html", root),
);
const css = await Deno.readTextFile(
  new URL("vendor/govuk-frontend-6.4.0/govuk-frontend.min.css", root),
);
export function createApp(): (request: Request) => Promise<Response> {
  return (request) => {
    const path = new URL(request.url).pathname;
    if (request.method !== "GET") {
      return Promise.resolve(new Response("Not found", { status: 404 }));
    }
    if (path === "/") {
      return Promise.resolve(response(html, "text/html; charset=utf-8"));
    }
    if (path === "/assets/govuk-frontend.min.css") {
      return Promise.resolve(response(css, "text/css; charset=utf-8"));
    }
    return Promise.resolve(new Response("Not found", { status: 404 }));
  };
}

function response(body: BodyInit, contentType: string): Response {
  return new Response(body, { headers: { "content-type": contentType } });
}

if (import.meta.main) {
  console.log("Design consistency build 01: http://localhost:8020/");
  Deno.serve({ port: 8020 }, createApp());
}
