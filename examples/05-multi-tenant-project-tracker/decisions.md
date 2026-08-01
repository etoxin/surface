# Multi-tenant Project Tracker Decisions

## Running the example

The implementation is a deterministic, self-contained Deno reference. From the
repository root, run:

```sh
deno run --allow-net --allow-read \
  examples/05-multi-tenant-project-tracker/app/server.ts
```

Open `http://localhost:8007/`. Importing `server.ts` does not start a listener;
`startServer` runs only when the module is the program entry point. Focused tests run
with:

```sh
deno test --allow-read \
  examples/05-multi-tenant-project-tracker/app/domain_test.ts \
  examples/05-multi-tenant-project-tracker/app/server_test.ts
```

The Surface production stack names PostgreSQL and OIDC. This runnable example uses
process-local maps and a development identity header so it needs no database, identity
provider, secrets, or external service. The domain and request-handler functions are
exported so production adapters can replace those two boundaries.

## Design system

The browser stack pins Pico CSS 2.1.1. The official minified stylesheet is vendored and
served from `/assets/pico.min.css`, so the interface does not depend on a CDN. The page
uses its semantic forms, tables, buttons, typography, spacing, and focus styles. A small
inline stylesheet handles only the responsive workspace grid, branded header, role
labels, table overflow, and status-message states.

## Development identities and seed data

The browser sends the selected alias in `X-Dev-User`; the server maps it to a fixed user
ID. A request body cannot select or override the authenticated actor.

| Alias           | User ID                                | Initial memberships             |
| --------------- | -------------------------------------- | ------------------------------- |
| `owner`         | `00000000-0000-4000-8000-000000000001` | Atlas owner; Beacon viewer      |
| `administrator` | `00000000-0000-4000-8000-000000000002` | Atlas administrator             |
| `contributor`   | `00000000-0000-4000-8000-000000000003` | Atlas contributor               |
| `viewer`        | `00000000-0000-4000-8000-000000000004` | Atlas viewer                    |
| `dual`          | `00000000-0000-4000-8000-000000000005` | Atlas contributor; Beacon owner |
| `outsider`      | `00000000-0000-4000-8000-000000000099` | None                            |

The tenant IDs are:

- Atlas Studio: `11111111-1111-4111-8111-111111111111`
- Beacon Works: `22222222-2222-4222-8222-222222222222`

Each tenant deliberately has a different project with the shared ID
`33333333-3333-4333-8333-333333333333` and a different work item with the shared ID
`44444444-4444-4444-8444-444444444444`. This makes accidental global-ID lookup visible
during development and tests. Newly created records receive deterministic UUID-shaped
IDs within each fresh in-memory state.

## Isolation, authorization, and failures

Membership, project, and work-item storage keys combine tenant ID with their second
identifier. Every domain operation authorizes the exact actor/tenant membership before
reading or writing tenant data. Parent-project and assignee checks use that same tenant
ID. Returned objects are copies containing only their declared fields, which prevents a
caller from mutating stored state or receiving adapter metadata.

Owner, administrator, contributor, and viewer grants follow the specification literally.
In particular, administrators cannot manage membership and contributors cannot create or
update projects. A user's role in one tenant never affects another.

Every well-formed operation that is denied or encounters a missing ID, cross-tenant ID,
invalid domain value, duplicate name, invalid assignment, or optimistic-version conflict
receives the same HTTP 404 body:

```json
{ "error": "unavailable" }
```

Malformed JSON and malformed field types receive `400 invalidRequest`, before a domain
resource lookup occurs. Missing development authentication receives
`401 authenticationRequired`. Unknown routes use the same unavailable response.

## HTTP mapping and browser safety

The API routes are:

- `GET /api/tenants`
- `GET /api/tenants/{tenantId}/workspace`
- `POST /api/tenants/{tenantId}/projects`
- `PUT /api/tenants/{tenantId}/projects/{projectId}`
- `POST /api/tenants/{tenantId}/work-items`
- `PUT /api/tenants/{tenantId}/work-items/{workItemId}`
- `PUT /api/tenants/{tenantId}/memberships/{memberUserId}`

The tenant selector is rebuilt only from `GET /api/tenants`. Switching user or tenant
increments a request generation and clears the previous workspace immediately. A
workspace response is rendered only when both its generation and returned `tenantId`
still match the current selection. This prevents a slow response from restoring data
from a tenant the user has already left. Forms are shown from the selected membership's
role, while the server independently enforces every permission.
