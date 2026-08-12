import { defineEvent } from "@tothalex/cloud";

export default defineEvent({
  name: "on-tick",
  event: "tick",
  timeout: 30, // seconds
  handler: async (payload) => {
    const data = JSON.parse(payload.toString());
    console.log("Received tick event:", data);
  },
});
