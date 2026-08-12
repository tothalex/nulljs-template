import { Buffer } from "buffer";
import { send } from "cloud/event";
import type { CronConfig } from "cloud";

const handler = async () => {
  console.log("Cron tick — sending event");
  // Event payloads must be binary (Buffer/typed array); handlers receive a Buffer.
  await send("tick", Buffer.from(JSON.stringify({ at: new Date().toISOString() })));
};

export default {
  name: "every-minute",
  cron: "0 * * * * *", // 6-field (with seconds); 5-field expressions work too
  timeout: 30, // seconds
  handler,
} satisfies CronConfig & { handler: typeof handler };
