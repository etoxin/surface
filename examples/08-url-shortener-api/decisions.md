# URL Shortener API Decisions

## HTTP and Domain Mapping

`POST /links` reads `destination` and optional `customSlug` from a JSON object and the
credential from the `Authorization` header. It returns JSON matching
`createShortLinkResult`; its HTTP response status is also the result's `httpStatus`.
`GET /{slug}` follows the same mapping for `resolveShortLinkResult` and sets the HTTP
`Location` header on a successful 302 response.

The exported domain functions remain independent of HTTP, and the exported request
handler does not own global state. This permits focused tests and lets an embedding
application choose its database lifetime. Importing `server.ts` does not start a
listener; executing it directly binds port 8004.

## Storage and Slugs

The implementation uses Deno's `node:sqlite` compatibility module rather than a hosted
service or third-party dependency. The executable server stores data in
`short-links.sqlite` beside this file's parent `app` directory. Tests use SQLite's
in-memory mode. A unique database constraint on `slug` enforces the declared invariant
even if concurrent requests race.

Custom slugs are stored as supplied and URL-encoded when combined with the declared
`https://sho.rt` base URL. When `customSlug` is omitted, the server generates a
ten-character slug from a UUID and retries a bounded number of times if a generated
value collides.

The declared creation input has no field that chooses the link's `protected` value. To
preserve that API contract, links created through `POST /links` default to unprotected.
The storage and resolution layers support protected records: a protected link returns
401 when the credential is absent, 403 when it is present but invalid, and 302 when it
is valid. This behavior is tested by inserting a protected record through the exported
SQLite store.

## Development Authentication

This self-contained example deliberately uses the deterministic, non-secret credential
below:

```text
Authorization: Bearer surface-development-credential
```

It protects link creation and protected-link resolution without implying that the
example contains a deployable secret-management scheme. A production implementation
would obtain and compare credentials through deployment-owned configuration.

## Running and Testing

From the repository root, run:

```sh
deno run --allow-net --allow-read --allow-write \
  examples/08-url-shortener-api/app/server.ts
deno test --allow-read --allow-write \
  examples/08-url-shortener-api/app/server_test.ts
```

The API is then available at `http://localhost:8004`.
