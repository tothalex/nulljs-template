---
name: new-api-route
description: Create a new HTTP API route (endpoint) in this NullJS app. Use when the user wants a new API endpoint, HTTP route, REST handler, or webhook receiver.
---

# New API route

One file per route under `src/function/api/`. The file default-exports a config object containing
the handler. Name the file after the route (e.g. `users.ts` for `/users`).

## Template

```ts
import type { HttpRequest, HttpResponse, RouteConfig } from "cloud";

const handler = async (request: HttpRequest): Promise<HttpResponse> => {
  const { id } = request.params; // from :id in the route

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  };
};

export default {
  name: "get-user",          // unique within the app
  route: "GET /users/:id",   // "METHOD /path"; bare path defaults to GET
  timeout: 10,               // SECONDS (default 30, max 900)
  secrets: [],               // secret names to inject as process.env; omit = all, [] = none
  handler,
} satisfies RouteConfig & { handler: typeof handler };
```

## Config rules

- `route`: `"METHOD /path"`. Params as `:name` (in `request.params`), trailing `*` for catch-all.
  Methods: GET/POST/PUT/DELETE/PATCH/HEAD. Routes must not collide with the SPA catch-all — the
  SPA uses `*`, explicit routes win.
- `schema` (optional): JSON Schema object validating the request body; invalid requests are
  rejected before the handler runs. Example: `schema: { type: "object", required: ["email"], properties: { email: { type: "string" } } }`.
- `size` (optional): `'small' | 'medium' | 'large' | 'xlarge'` — memory tier, default small.

## Request/response contract

- `request.body` — UTF-8 string (`''` when body isn't valid UTF-8); parse JSON yourself:
  `JSON.parse(request.body)`. Binary: `request.body_bytes` (Uint8Array).
- `request.query_params` (last-wins) / `query_params_all`; `request.headers` (comma-joined) /
  `headers_all`.
- Response `headers` values may be `string[]` — one header line each (needed for multiple
  `Set-Cookie`). Response `body`: string or Buffer/typed array for binary.

## Verify

With `bun run dev` running, the route deploys automatically on save. Then:

```bash
curl http://<app-name>.localhost:3001/users/123
```

`<app-name>` is `name` from `package.json`. If the response isn't what you expect, read the
function's logs and error messages via the API — see the `read-logs` skill.
