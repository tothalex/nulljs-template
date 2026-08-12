import { Buffer } from "buffer";
import { send } from "cloud/event";
import { defineCron } from "@tothalex/cloud";

export default defineCron({
  name: "every-minute",
  cron: "0 * * * * *", // 6-field (with seconds); 5-field expressions work too
  timeout: 30, // seconds
  handler: async () => {
    console.log("Cron tick — sending event");
    // Event payloads must be binary (Buffer/typed array); handlers receive a Buffer.
    await send("tick", Buffer.from(JSON.stringify({ at: new Date().toISOString() })));
  },
});
