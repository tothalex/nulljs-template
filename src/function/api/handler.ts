import { defineRoute } from "@tothalex/cloud";

export default defineRoute({
  name: "hello",
  route: "GET /hello",
  timeout: 10, // seconds
  handler: async (request) => {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello, World!",
        method: request.method,
        path: request.path,
      }),
    };
  },
});
