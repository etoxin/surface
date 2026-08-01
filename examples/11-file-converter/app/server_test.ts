import {
  DEFAULT_PORT,
  handleFileConverterRequest,
  renderFileConverterPage,
} from "./server.ts";

function assert(condition: unknown, message = "Assertion failed"): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test("renderFileConverterPage embeds the importable converter", () => {
  const html = renderFileConverterPage(
    "<script>/*__CONVERT_FILE__*/</script>",
  );

  assert(html.includes("function convertFile("));
  assert(!html.includes("__CONVERT_FILE__"));
});

Deno.test("response routing serves only GET slash", async () => {
  const html = "<!doctype html><title>File Converter</title>";
  const rootResponse = handleFileConverterRequest(
    new Request("http://localhost:8005/"),
    html,
  );
  assert(rootResponse.status === 200);
  assert(
    rootResponse.headers.get("content-type") ===
      "text/html; charset=utf-8",
  );
  assert(await rootResponse.text() === html);

  for (
    const request of [
      new Request("http://localhost:8005/missing"),
      new Request("http://localhost:8005/", { method: "POST" }),
    ]
  ) {
    const response = handleFileConverterRequest(request, html);
    assert(response.status === 404);
    assert(await response.text() === "Not found");
  }

  assert(DEFAULT_PORT === 8005);
});
