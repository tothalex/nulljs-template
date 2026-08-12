import { defineRoute } from "@tothalex/cloud";

// `schema` is the single source of truth: it validates the request body before the
// handler runs, the handler receives `request.body` already JSON-parsed, and its
// TypeScript type is INFERRED from the schema (text: string, repeat?: number) — no
// generic, no duplication. Structural schema mistakes fail `bun run typecheck`.
export default defineRoute({
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
