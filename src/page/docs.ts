import { defineSveltePage } from "@tothalex/cloud";

// Config for src/page/docs.svelte (same stem = its config, not a separate function).
// name and route are optional — they default from the file stem ("docs" → "/docs").
export default defineSveltePage<{ topic: string; hits: number }>({
  route: "/docs",
  props: async (request) => ({
    topic: request.query_params.topic ?? "getting-started",
    hits: 1,
  }),
});
