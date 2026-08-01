const exampleRoot = new URL("../../", import.meta.url);

class AssetApplication {
  #assets = new Map<string, { path: string; type: string }>([
    ["/", {
      path: "builds/02-template-clones/index.html",
      type: "text/html; charset=utf-8",
    }],
    ["/assets/govuk-frontend.min.css", {
      path: "vendor/govuk-frontend-6.4.0/govuk-frontend.min.css",
      type: "text/css; charset=utf-8",
    }],
  ]);

  async handle(request: Request): Promise<Response> {
    if (request.method !== "GET") return new Response("Not found", { status: 404 });
    const asset = this.#assets.get(new URL(request.url).pathname);
    if (!asset) return new Response("Not found", { status: 404 });
    const body = await Deno.readFile(new URL(asset.path, exampleRoot));
    return new Response(body, { headers: { "content-type": asset.type } });
  }
}

export function createApp(): (request: Request) => Promise<Response> {
  const application = new AssetApplication();
  return application.handle.bind(application);
}

if (import.meta.main) {
  console.log("Design consistency build 02: http://localhost:8021/");
  Deno.serve({ port: 8021 }, createApp());
}
