# AGENTS.md

Guide for AI agents (and humans) working in this NullJS application.

## What this is

A **NullJS application**: a collection of serverless JavaScript/TypeScript functions (HTTP routes,
cron jobs, event handlers) plus an optional React SPA, deployed to a NullJS server. Functions run
inside pooled QuickJS runtimes — this is **not Node.js** (see "Runtime constraints" below).

The application name comes from the `name` field in `package.json`. On the server, the app is
routed by subdomain: `http://{app-name}.{base-domain}/...` (in dev: `http://nulljs-template.localhost:3001`).

## Layout

```
src/
  function/
    api/       HTTP route functions   (one file = one function)
    cron/      scheduled functions
    event/     event handler functions
  index.tsx    optional React SPA entry (exports `Page`); delete it if you don't need a UI
  lib/         shared code, bundled into each function that imports it
  cloud.d.ts   pulls in the ambient types from @tothalex/cloud — don't remove
.secret        local secrets (KEY=VALUE lines, gitignored) — deploy with `nulljs secret deploy`
.claude/skills # step-by-step skills for common tasks (new route/cron/event, cloud modules)
```

Files anywhere under `src/function/{api,cron,event}/` ending in `.ts`/`.tsx` are discovered and
deployed automatically — the directory determines the trigger type expected in the config.

## Function anatomy

Every function file **default-exports its definition** via the `defineRoute` / `defineCron` /
`defineEvent` helpers from `@tothalex/cloud`. They are identity functions — zero runtime cost —
that type-check the config fields and the handler signature for that trigger type in one place:

```ts
import { defineRoute } from "@tothalex/cloud";

export default defineRoute({
  name: "my-route",        // unique within the app
  route: "GET /things/:id",
  timeout: 10,             // SECONDS (default 30, max 900) — not milliseconds!
  handler: async (request) => {
    return { statusCode: 200, body: request.params.id };
  },
});
```

The `request` parameter and return type are inferred (`HttpRequest` → `HttpResponse`); a cron
handler takes no arguments; an event handler receives a `Buffer`. The config is parsed server-side
at deploy time by evaluating the module, so keep the definition statically sound.

Shared config fields (all types): `name` (required), `timeout?` (seconds), `size?`
(`'small' | 'medium' | 'large' | 'xlarge'` — memory limit and pool capacity), `secrets?`
(`string[]` — names of secrets to inject as `process.env`; **omit** = all app secrets,
`[]` = none; prefer listing exactly what the function needs).

Per-type fields:

| Type  | Field | Format | Handler signature |
|-------|-------|--------|-------------------|
| Route | `route` | `"METHOD /path"`, `:param` params, `*` catch-all; bare path = GET | `(request: HttpRequest) => HttpResponse \| Promise<HttpResponse>` |
| Route | `schema?` | `JsonSchema` object validating the request body — the single source of truth: `request.body`'s TS type is inferred from it (no generic), structural mistakes fail `tsc`, uncompilable schemas are rejected at deploy with the reason | — |
| Cron  | `cron` | 5- or 6-field cron expression (5-field gets seconds prepended) | `() => void \| Promise<void>` |
| Event | `event` | event name string | `(payload) => void \| Promise<void>` — payload typed from `schema` when declared, else `Buffer` |
| Event | `schema?` | `JsonSchema` validating the payload; handler gets it parsed+typed, violations record a failed invocation with the reason | — |

The full types live in `node_modules/@tothalex/cloud/src/` — `cloud/index.d.ts` for configs and
the HTTP contract, `cloud/*.d.ts` for the runtime modules. Treat those files as the source of truth.

**HTTP contract highlights:** `request.body` is UTF-8 text (`''` if not valid UTF-8 — use
`request.body_bytes: Uint8Array` for binary), `params` holds `:route` params, `query_params` is
last-wins (use `query_params_all` for repeats). Response `headers` values may be `string[]` (one
line each — the only way to send multiple `Set-Cookie`); `body` may be a string or typed array.

## Runtime modules (`cloud/*`)

Import these — never install npm equivalents; they're provided by the server and marked external
by the bundler:

- `cloud/got` — HTTP client: `got.get/post/put/delete<T>(url, { json, headers, timeout, responseType })`
- `cloud/postgres` — `const db = await pg(url)`; `` db.sql`SELECT … ${v}` `` (tagged template,
  parameterized), `fetchAll/fetchOne/execute`, `db.transaction(async (tx) => …)`
- `cloud/cache` — app-scoped KV: `cache.set(key, value, ttlMs?)`, `get`, `remove`, `has`
- `cloud/secret` — `secret.get/store`, `secret.hash/verify_hash` (Argon2), `jwt.sign(claims, expiresInSeconds?)` / `jwt.verify(token)`
- `cloud/event` — `send(eventName, payload)` delivers to this app's event functions; plain
  objects/strings are serialized for you (Buffers pass through). Handlers with a `schema`
  receive the payload parsed, validated, and typed; without one, a `Buffer`
- `cloud/uuid` — `uuid()`

There is no filesystem module and no `child_process` — deliberately. Don't try to polyfill them.

## Runtime constraints

- Engine is **QuickJS with llrt's Node-compat subset**, not Node. Available built-ins: `assert`,
  `buffer`, `crypto`, `dns`, `events`, `net`, `os`, `process`, `stream/web`, `string_decoder`,
  `timers`, `tty`, `url`, `util`, `zlib`. Also `fetch`. **No `fs`, no `child_process`, no `http`.**
- npm packages are bundled into the deployed function. Prefer the `cloud/*` modules and built-ins;
  a heavy dependency bloats every deploy and may rely on Node APIs that don't exist here.
- Secrets arrive as `process.env.MY_SECRET`. Never hardcode credentials.
- Handlers must return/resolve within `timeout` seconds or the invocation is cancelled.

## Workflows

```bash
bun install            # once
bun run dev            # nulljs dev: local server + auto-deploy on save + Vite for the SPA
bun test               # unit tests (in-memory cloud/* doubles — see the test-functions skill)
bun run typecheck      # tsc --noEmit
bun run deploy         # deploy all functions to the selected environment
npx nulljs secret deploy   # push .secret file values to the server
npx nulljs status          # server/app status
```

**Agents:** `npx nulljs dev --headless` runs the dev loop without the TUI, emitting NDJSON
events on stdout (`ready` with URLs+token, `deploy` results, `server-log`); add
`--api-port/--gateway-port` if the defaults are taken. `npx nulljs invoke /route -X POST -d
'{...}'` calls a deployed route (Host header handled for you); `npx nulljs logs
--function <name> [--follow]` and `npx nulljs invocations --status failed` read telemetry —
all support `--json`, none ever prompt when stdin isn't a TTY. Unit tests are the fastest
loop: `bun test` runs handlers against in-memory cloud/* modules in milliseconds.

`nulljs dev` runs everything locally: control plane + dashboard on **:3000**, function gateway on
**:3001**, and (when `src/index.tsx` exists) a Vite dev server on **:5173** that proxies `/api` and
`/assets` to the gateway. Saving a file under `src/` auto-deploys it.

**Verify a route:** `curl http://nulljs-template.localhost:3001/hello` (subdomain = `name` in
`package.json`).

**Reading logs (agents: this is how you see function output and errors):** mint a read-only token,
then query the control-plane API:

```bash
TOKEN=$(npx nulljs session | awk '/Token:/ {print $2}')
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/invocations?status=failed&limit=10"
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/logs?function_name=hello&limit=50"
```

Invocation records carry `status`, `duration_ms`, `error_message`, and `failure_phase`;
`/api/logs` returns `console.log` output (filter by `execution_id` to see one run). Full endpoint
and filter reference: the `read-logs` skill. Humans can use the dashboard at http://localhost:3000
instead.

## Conventions

- TypeScript strict; double quotes + semicolons (eslint config at root).
- One function per file; always define through `defineRoute`/`defineCron`/`defineEvent` so config
  typos and handler-signature mistakes fail typecheck instead of deploy.
- Shared helpers go in `src/lib/` — they're bundled into each function that imports them.
- Declare `secrets: [...]` explicitly on functions that use secrets.

## Skills

`.claude/skills/` contains step-by-step guides Claude Code loads on demand: `new-api-route`,
`new-cron-job`, `new-event-handler`, `cloud-modules`, `test-functions` (bun test with the
in-memory cloud/* doubles), and `read-logs` (querying logs, invocations, and error messages).
Use them when adding functions, writing tests, or debugging.
