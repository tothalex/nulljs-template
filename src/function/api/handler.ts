import { defineRoute, json } from "@tothalex/cloud";

export default defineRoute({
  name: "hello",
  route: "GET /hello",
  timeout: 10, // seconds
  handler: async (request) => {
    return json({
      message: "Hello, World!",
      method: request.method,
      path: request.path,
    });
  },
});
