const handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({ message: "Hello, World!" }),
  };
};

export default {
  name: "route-handler",
  timeout: 1000,
  route: "GET hey",
  handler,
};
