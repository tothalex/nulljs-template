import type { EventConfig } from "cloud";

const handler = async (payload: Buffer) => {
  const data = JSON.parse(payload.toString());
  console.log("Received tick event:", data);
};

export default {
  name: "on-tick",
  event: "tick",
  timeout: 30, // seconds
  handler,
} satisfies EventConfig & { handler: typeof handler };
