import type { HttpRequest, HttpResponse, RouteConfig } from "cloud";

const handler = async (request: HttpRequest): Promise<HttpResponse> => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Hello, World!",
      method: request.method,
      path: request.path,
    }),
  };
};

export default {
  name: "hello",
  route: "GET /hello",
  timeout: 10, // seconds
  handler,
} satisfies RouteConfig & { handler: typeof handler };
