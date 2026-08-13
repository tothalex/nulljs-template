export const Page: React.FC = () => {
  return <div>Hello, World</div>;
};

// Only `route` is read for SPAs. "*" makes the SPA the app-wide fallback: every path
// without a more specific owner (API routes, SSR pages) serves this shell — which is
// what a client-side router needs for deep links. Mount under a subtree with
// "/app/*" (also serves /app itself). Svelte SPAs live in index.svelte instead;
// a Solid SPA is this same file importing solid-js.
export const config = {
  name: "index",
  route: "*",
};
