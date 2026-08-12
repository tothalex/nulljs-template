---
name: new-cron-job
description: Create a new cron job (scheduled function) in this NullJS app. Use when the user wants a scheduled task, recurring job, periodic function, or anything running on a timer/schedule.
---

# New cron job

One file per job under `src/function/cron/`. The file default-exports a config object containing
the handler.

## Template

```ts
import type { CronConfig } from "cloud";

const handler = async () => {
  console.log("running scheduled work");
};

export default {
  name: "nightly-cleanup",   // unique within the app
  cron: "0 0 3 * * *",       // 6-field: sec min hour day month weekday
  timeout: 60,               // SECONDS (default 30, max 900)
  secrets: [],               // secret names injected as process.env; omit = all, [] = none
  handler,
} satisfies CronConfig & { handler: typeof handler };
```

## Cron expression rules

- **6 fields**: `sec min hour day month weekday`. A **5-field** expression (standard crontab) is
  accepted too — a `0` seconds field is prepended automatically.
- Examples: every minute `0 * * * * *`; every 15 seconds `*/15 * * * * *`; daily at 03:00
  `0 0 3 * * *`; Mondays at 09:00 `0 0 9 * * 1`.

## Rules of thumb

- The handler receives no arguments and its return value is ignored — side effects only.
- Long work must fit in `timeout` seconds (max 900) or the invocation is cancelled.
- To fan work out, send events (`send` from `cloud/event`) and process them in event functions
  instead of doing everything in one long cron invocation.

## Verify

With `bun run dev` running, the job deploys on save and starts firing on schedule. Check
`console.log` output and invocations in the dashboard at http://localhost:3000. For a quick test,
temporarily use a fast schedule like `*/10 * * * * *` (every 10s), confirm it fires, then set the
real schedule.
