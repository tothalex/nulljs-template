---
name: read-logs
description: Read function logs, invocation history, and error messages from the NullJS server via its API. Use when debugging a function, checking why an invocation failed, verifying a cron/event fired, or whenever you need to see console.log output or errors from deployed functions.
---

# Reading logs and invocations

Functions' `console.log`/`console.error` output and every invocation (with status, duration, and
error message) are stored on the server and readable through the control-plane API. The dashboard
at http://localhost:3000 shows the same data, but the API is what you can read directly.

## 1. Get a read-only token (once per session)

```bash
TOKEN=$(npx nulljs session | awk '/Token:/ {print $2}')
```

The token is read-only and expires; mint a new one if requests start returning 401. All requests
below go to the control plane — `http://localhost:3000` in dev (`npx nulljs config list` shows the
API URL per environment) — with `-H "Authorization: Bearer $TOKEN"`.

## 2. Invocations — what ran and whether it failed

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/invocations?limit=20"
```

Filters (all optional query params): `function_name`, `status` (`completed` | `failed` |
`timeout` | `running`), `trigger_type` (`route` | `cron` | `event`), `application_id`,
`function_id`, `limit`, `offset`.

Each record includes `function_name`, `execution_id`, `status`, `started_at`, `duration_ms`,
`error_message`, and `failure_phase` — for a failing function, `error_message` is usually the
answer. Aggregates: `GET /api/invocations/stats`.

## 3. Execution logs — console output from functions

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/logs?function_name=hello&limit=50"
```

Filters: `function_name`, `execution_id`, `level`, `message` (substring match), `application_id`,
`function_id`, `limit`, `offset`.

## 4. Server-side logs

`GET /api/system/logs` — the server's own logs (deploy failures, runtime errors outside a
function's console). Check here when a function deploys but never appears, or invocations fail
before the handler runs.

## Debug recipe

1. `GET /api/invocations?function_name=<name>&status=failed&limit=5` → read `error_message` /
   `failure_phase`.
2. Take the `execution_id` of a failed run → `GET /api/logs?execution_id=<id>` for the
   console output of exactly that invocation.
3. Nothing in either? `GET /api/system/logs` — the failure likely happened before the handler
   (deploy, config parse, schema validation).
