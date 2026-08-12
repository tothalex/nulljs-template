import { send } from "cloud/event";
import { defineCron } from "@tothalex/cloud";

export default defineCron({
  name: "every-minute",
  cron: "0 * * * * *", // 6-field (with seconds); 5-field expressions work too
  timeout: 30, // seconds
  handler: async () => {
    console.log("Cron tick — sending event");
    // Plain objects are serialized for you; the receiving handler's schema types them.
    await send("tick", { at: new Date().toISOString() });
  },
});
