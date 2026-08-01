const defaultPort = 8002;

export function handleFaqRequest(request: Request, html: string): Response {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/faq") {
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

if (import.meta.main) {
  const html = await Deno.readTextFile(new URL("./index.html", import.meta.url));
  console.log(`Static FAQ: http://localhost:${defaultPort}/faq`);
  Deno.serve({ port: defaultPort }, (request) => handleFaqRequest(request, html));
}
