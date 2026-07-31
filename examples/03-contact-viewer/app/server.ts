interface Contact {
  id: string;
  name: string;
  email?: string;
  active: boolean;
}

const contacts = new Map<string, Contact>([
  [
    "ada",
    {
      id: "ada",
      name: "Ada Lovelace",
      email: "ada@example.com",
      active: true,
    },
  ],
  [
    "grace",
    {
      id: "grace",
      name: "Grace Hopper",
      active: false,
    },
  ],
]);

export function renderContactPage(id: string | null): string {
  if (id === null || id === "") {
    return page(`
      <section>
        <h1>Select a contact</h1>
        <p>Choose a contact identifier to view its details.</p>
        <nav aria-label="Example contacts">
          <a href="/contacts?id=ada">Ada</a>
          <a href="/contacts?id=grace">Grace</a>
        </nav>
      </section>
    `);
  }

  const contact = contacts.get(id);
  if (contact === undefined) {
    return page(`
      <section>
        <h1>Contact not found</h1>
        <p>No contact exists for the selected identifier.</p>
        <a href="/contacts">Choose another contact</a>
      </section>
    `);
  }

  return page(`
    <section>
      <h1>Contact</h1>
      <dl>
        <dt>Name</dt>
        <dd>${escapeHtml(contact.name)}</dd>
        <dt>Email</dt>
        <dd>${
    contact.email === undefined ? "Not provided" : escapeHtml(contact.email)
  }</dd>
        <dt>Active</dt>
        <dd>${contact.active ? "Yes" : "No"}</dd>
      </dl>
      <a href="/contacts">Choose another contact</a>
    </section>
  `);
}

function page(content: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Contact Viewer</title>
    <style>
      :root {
        font-family: system-ui, sans-serif;
        background: #f5f2eb;
        color: #24211d;
      }
      body {
        margin: 0;
      }
      main {
        width: min(36rem, calc(100% - 2rem));
        margin: 4rem auto;
      }
      dl {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 0.75rem 1.5rem;
      }
      dt {
        font-weight: 700;
      }
      dd {
        margin: 0;
      }
      nav, a {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
      }
    </style>
  </head>
  <body>
    <main>${content}</main>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

if (import.meta.main) {
  Deno.serve((request) => {
    const url = new URL(request.url);
    if (url.pathname !== "/contacts") {
      return new Response("Not found", { status: 404 });
    }
    return new Response(renderContactPage(url.searchParams.get("id")), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  });
}
