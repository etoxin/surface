export function parseCounterValue(value: string | null): number {
  if (value === null || !/^\d+$/.test(value)) {
    return 0;
  }

  const count = Number(value);
  return Number.isSafeInteger(count) ? count : 0;
}

export function renderCounterPage(count: number): string {
  const safeCount = Number.isSafeInteger(count) && count >= 0 ? count : 0;
  const nextCount = safeCount < Number.MAX_SAFE_INTEGER ? safeCount + 1 : safeCount;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Click Counter</title>
    <style>
      :root {
        font-family: system-ui, sans-serif;
        background: #f3f0ff;
        color: #211a36;
      }
      body {
        margin: 0;
      }
      main {
        display: grid;
        place-items: center;
        min-height: 100vh;
      }
      section {
        width: min(28rem, calc(100% - 2rem));
        padding: 2.5rem;
        border: 1px solid #c8bde8;
        border-radius: 1rem;
        background: white;
        box-shadow: 0 1rem 3rem rgb(54 35 101 / 12%);
        text-align: center;
      }
      output {
        display: block;
        margin: 1rem 0 1.5rem;
        font-size: clamp(4rem, 20vw, 7rem);
        font-variant-numeric: tabular-nums;
        font-weight: 750;
      }
      form {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
      }
      button {
        min-height: 2.75rem;
        padding: 0.6rem 1rem;
        border: 1px solid #6951a3;
        border-radius: 0.55rem;
        background: #6951a3;
        color: white;
        font: inherit;
        font-weight: 650;
        cursor: pointer;
      }
      button[value="0"] {
        background: white;
        color: #493477;
      }
      button:focus-visible {
        outline: 3px solid #e0a400;
        outline-offset: 3px;
      }
    </style>
  </head>
  <body>
    <main>
      <section aria-labelledby="counter-title">
        <h1 id="counter-title">Click Counter</h1>
        <output aria-live="polite" aria-label="Current count">${safeCount}</output>
        <form action="/" method="get">
          <button type="submit" name="count" value="${nextCount}">Increment</button>
          <button type="submit" name="count" value="0">Reset</button>
        </form>
      </section>
    </main>
  </body>
</html>`;
}

export function handleCounterRequest(request: Request): Response {
  const url = new URL(request.url);
  if (url.pathname !== "/") {
    return new Response("Not found", { status: 404 });
  }

  const count = parseCounterValue(url.searchParams.get("count"));
  return new Response(renderCounterPage(count), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

if (import.meta.main) {
  Deno.serve({ port: 8001 }, handleCounterRequest);
}
