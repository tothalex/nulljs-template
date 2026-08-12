---
name: new-api-route
description: Create a new HTTP API route (endpoint) in this NullJS app. Use when the user wants a new API endpoint, HTTP route, REST handler, or webhook receiver.
---

# New API route

One file per route under `src/function/api/`. The file default-exports a config object containing
the handler. Name the file after the route (e.g. `users.ts` for `/users`).

## Template

```ts
import { defineRoute } from "@tothalex/cloud";

export default defineRoute({
  name: "get-user",          // unique within the app
  route: "GET /users/:id",   // "METHOD /path"; bare path defaults to GET
  timeout: 10,               // SECONDS (default 30, max 900)
  secrets: [],               // secret names to inject as process.env; omit = all, [] = none
  handler: async (request) => {
    const { id } = request.params; // from :id in the route
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    };
  },
});
```

`defineRoute` is a zero-cost identity helper: `request` is inferred as `HttpRequest`, the return
type is checked as `HttpResponse`, and config typos are compile errors.

## Config rules

- `route`: `"METHOD /path"`. Params as `:name` (in `request.params`), trailing `*` for catch-all.
  Methods: GET/POST/PUT/DELETE/PATCH/HEAD. Routes must not collide with the SPA catch-all — the
  SPA uses `*`, explicit routes win.
- `schema` (optional): JSON Schema object validating the request body; invalid requests get a
  `400` with the validation reason before the handler runs, and the handler receives
  `request.body` already JSON-parsed — type it via `defineRoute<MyBody>(...)`. The field is a typed `JsonSchema`, so structural mistakes
  (`required: "email"` instead of `["email"]`, misspelled keywords) fail `bun run typecheck`;
  schemas that pass typecheck but fail to compile (bad `$ref`, malformed `pattern` regex) are
  rejected at deploy time with the reason. Example:
  `schema: { type: "object", required: ["email"], properties: { email: { type: "string" } } }` —
  see `src/function/api/echo.ts` for a working one.
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
