---
name: test-functions
description: Write and run unit tests for NullJS functions with bun test. Use when the user wants tests for a route/cron/event function, asks to verify handler logic, or before/after changing a handler.
---

# Testing functions

Functions are unit-testable in milliseconds: `bunfig.toml` preloads `@tothalex/cloud/testing`,
which registers in-memory `cloud/*` modules, so handler files import cleanly under `bun test`.
Colocate tests next to functions as `<name>.test.ts` — the CLI never deploys `*.test.ts`.

```bash
bun test              # run all tests
bun test echo         # run tests matching "echo"
```

## Template

```ts
import { describe, test, expect, beforeEach } from "bun:test";
import { cloudTest, invokeRoute, invokeCron, invokeEvent } from "@tothalex/cloud/testing";

import myRoute from "./my-route";

beforeEach(() => cloudTest.reset()); // clears cache/events/secrets between tests

test("returns 200", async () => {
  const response = await invokeRoute(myRoute, {
    method: "POST",
    path: "/things",
    params: { id: "123" },          // :params from the route
    body: { name: "thing" },        // schema routes: pass the OBJECT (handler gets it parsed)
  });
  expect(response.statusCode).toBe(200);
});
```

## Harnesses

- `invokeRoute(def, partialRequest?)` — builds a full `HttpRequest` around your partial one.
  For routes **with a `schema`**, pass `body` as an object (or JSON string — parsed for you),
  matching production where the body arrives pre-parsed. Without a schema, `body` is a string.
- `invokeCron(def)` — calls the handler with no arguments.
- `invokeEvent(def, payload)` — string payloads are Buffer-wrapped like `send` requires.

## Inspecting side effects (`cloudTest`)

- `cloudTest.events.sent` — every `send()` call as `{name, payload: Buffer}`; assert on
  `JSON.parse(payload.toString())`. Feed a captured payload to `invokeEvent` to test a
  cron→event pipeline end to end.
- `cloudTest.secrets.set(key, value)` — seed secrets that `secret.get()` should return.
- `cloudTest.postgres.set((url) => fakeDb)` — `pg()` throws by default; inject a fake with
  the `sql`/`fetchAll`/`fetchOne`/`execute`/`transaction` methods your handler uses.
- `cloudTest.reset()` — clear everything (put it in `beforeEach`).

Fidelity notes: `send()` rejects non-Buffer payloads exactly like production; `cloud/got`
uses `fetch` underneath, so mock `fetch` (e.g. Bun's `mock.module` or a test server) for
outbound HTTP; secrets from function config (`process.env.X`) are just env vars in tests —
set `process.env.X` directly.
