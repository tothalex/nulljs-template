import { defineEvent } from "@tothalex/cloud";

// With a `schema`, the payload arrives JSON-parsed, validated, and typed by inference —
// no JSON.parse(payload.toString()). A payload violating the schema records a failed
// invocation with the reason instead of running the handler.
export default defineEvent({
  name: "on-tick",
  event: "tick",
  timeout: 30, // seconds
  schema: {
    type: "object",
    required: ["at"],
    properties: {
      at: { type: "string" },
    },
  },
  handler: async (payload) => {
    console.log("Received tick event at:", payload.at); // payload.at: string — inferred
  },
});
