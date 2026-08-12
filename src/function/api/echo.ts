import { defineRoute } from "@tothalex/cloud";

// `schema` validates the request body before the handler runs, and the handler receives
// `request.body` already JSON-parsed, typed by the generic below. The schema object is
// fully typed too: structural mistakes (e.g. `required: "text"` instead of `["text"]`)
// fail `bun run typecheck` instead of the deploy.
export default defineRoute<{ text: string; repeat?: number }>({
  name: "echo",
  route: "POST /echo",
  timeout: 10,
  schema: {
    type: "object",
    required: ["text"],
    properties: {
      text: { type: "string", minLength: 1 },
      repeat: { type: "integer", minimum: 1, maximum: 10 },
    },
  },
  handler: async (request) => {
    const { text, repeat = 1 } = request.body;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ echo: Array(repeat).fill(text).join(" ") }),
    };
  },
});
