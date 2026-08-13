import { definePage } from "@tothalex/cloud";

type Props = { message: string; renderedAt: string };

// The named `Page` export is rendered to HTML on the server per request and hydrated
// in the browser with the same props — client-side interactivity (useState etc.) works.
export const Page = ({ message, renderedAt }: Props) => (
  <main>
    <h1>{message}</h1>
    <p>Server-rendered at {renderedAt}</p>
  </main>
);

export default definePage<Props>({
  name: "hello-page",
  route: "/ssr",
  // Runs server-side with full function powers (secrets, cloud/* modules).
  // The result must be JSON-serializable — it ships to the browser for hydration.
  props: async (request) => ({
    message: `Hello, ${request.query_params.name ?? "World"}!`,
    renderedAt: new Date().toISOString(),
  }),
});
