import { convertFile } from "./converter.ts";

export const DEFAULT_PORT = 8005;

const converterMarker = "/*__CONVERT_FILE__*/";

export function renderFileConverterPage(template: string): string {
  if (!template.includes(converterMarker)) {
    throw new Error("The file converter template is missing its script marker.");
  }

  return template.replace(converterMarker, convertFile.toString());
}

export function handleFileConverterRequest(
  request: Request,
  html: string,
): Response {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/") {
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
  const template = await Deno.readTextFile(new URL("./index.html", import.meta.url));
  const html = renderFileConverterPage(template);
  console.log(`File Converter: http://localhost:${DEFAULT_PORT}/`);
  Deno.serve(
    { port: DEFAULT_PORT },
    (request) => handleFileConverterRequest(request, html),
  );
}
