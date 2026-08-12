---
name: new-event-handler
description: Create a new event handler or send events between functions in this NullJS app. Use when the user wants background/async processing, a pub-sub consumer, a queue-like worker, or to decouple work from an API request.
---

# New event handler

Events are NullJS's async messaging: any function can `send(eventName, payload)`, and every event
function in the same app subscribed to that name runs with the payload. Use them to move slow work
out of request handlers.

## Handler template

One file per handler under `src/function/event/`:

```ts
import { defineEvent } from "@tothalex/cloud";

export default defineEvent({
  name: "process-signup",   // unique within the app
  event: "user-signed-up",  // event name to subscribe to
  timeout: 60,              // SECONDS (default 30, max 900)
  secrets: [],              // secret names injected as process.env; omit = all, [] = none
  schema: {
    type: "object",
    required: ["userId"],
    properties: { userId: { type: "string" }, plan: { type: "string" } },
  },
  handler: async (payload) => {
    // payload is parsed, validated, and TYPED from the schema: { userId: string; plan?: string }
    console.log("processing signup for", payload.userId);
  },
});
```

`defineEvent` is a zero-cost identity helper. **Declare a `schema` and the handler receives the
payload already JSON-parsed, validated, and typed by inference** — no manual
`JSON.parse(payload.toString())`. A payload that violates the schema records a failed invocation
with the reason (visible in `nulljs invocations --status failed`) instead of running the handler.
Omit the schema and the handler receives the raw bytes as a `Buffer`.

## Sending events

From any function (route, cron, or another event handler):

```ts
import { send } from "cloud/event";

await send("user-signed-up", { userId: "123" });
```

Plain objects and strings are serialized for you (Buffers/typed arrays pass through as-is).
Events are fire-and-forget within the app — there is no reply channel; write results to
`cloud/cache` or the database if the sender needs them.

## Verify

With `pnpm dev` running, trigger the sender (e.g. curl the API route that calls `send`), then
check the handler ran (see the `read-logs` skill for the full API):

```bash
TOKEN=$(nulljs session | awk '/Token:/ {print $2}')
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/logs?function_name=<handler-name>&limit=20"
```

For an isolated test, add a temporary cron function that sends the event every few seconds.
