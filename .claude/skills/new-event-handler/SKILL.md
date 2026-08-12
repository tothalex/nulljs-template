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
  handler: async (payload) => {
    const data = JSON.parse(payload.toString());
    console.log("processing", data);
  },
});
```

`defineEvent` is a zero-cost identity helper; `payload` is inferred as **Buffer** — decode with
`payload.toString()` and parse as needed.

## Sending events

From any function (route, cron, or another event handler):

```ts
import { Buffer } from "buffer";
import { send } from "cloud/event";

await send("user-signed-up", Buffer.from(JSON.stringify({ userId: "123" })));
```

The payload **must be a Buffer/typed array** — the runtime rejects plain strings and objects, so
always wrap with `Buffer.from(...)`. Events are fire-and-forget within the app — there is no reply
channel; write results to `cloud/cache` or the database if the sender needs them.

## Verify

With `bun run dev` running, trigger the sender (e.g. curl the API route that calls `send`), then
check the handler ran (see the `read-logs` skill for the full API):

```bash
TOKEN=$(npx nulljs session | awk '/Token:/ {print $2}')
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/logs?function_name=<handler-name>&limit=20"
```

For an isolated test, add a temporary cron function that sends the event every few seconds.
