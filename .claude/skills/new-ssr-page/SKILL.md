---
name: new-ssr-page
description: Add a server-side-rendered React page (SSR) under src/page/. Use when the user wants a server-rendered page, SEO-friendly HTML, per-request dynamic HTML, or asks for "SSR".
---

# New SSR page

A `.tsx` file under `src/page/` is a server-side-rendered React page — the directory is
what makes it a page (like `src/function/`), one file per page. The server renders
`<Page {...props} />` to HTML per request (React production build via
`react-dom/server.edge` inside QuickJS) and the browser hydrates it with the same props.

## Steps

1. Create `src/page/<name>.tsx` exporting a `Page` component and a `definePage` default:

```tsx
import { definePage } from "@tothalex/cloud";

type Props = { user: string; count: number };

export const Page = ({ user, count }: Props) => (
  <main>
    <h1>Hi {user}</h1>
    <p>{count} items</p>
  </main>
);

export default definePage<Props>({
  name: "dashboard",
  route: "/dashboard",
  secrets: ["DATABASE_URL"],
  props: async (request) => {
    // Server-side: secrets and cloud/* modules work here.
    // The result must be JSON-serializable — it is embedded in the HTML for hydration.
    return { user: request.query_params.user ?? "you", count: 42 };
  },
});
```

2. With `pnpm dev` running, the page deploys on save. Open
   `http://<app>.localhost:3001/dashboard` — the HTML arrives server-rendered and
   live-reloads on save.

## Rules

- `Page` must be a **named export**; the default export is the config. The explicit
  generic (`definePage<Props>`) ties `props()`'s return type to the component's props.
- `props` is optional — omit it for a static page (still server-rendered, still SEO-visible).
- Never import `react-dom/server` yourself; the platform does the rendering.
- Server-only code (secrets, `cloud/*`) belongs in `props()` / the config — it is
  tree-shaken out of the browser bundle. The `Page` component runs on BOTH server and
  browser, so it must not touch `process.env` or `cloud/*`.
- `size` defaults to `medium` for pages (React's renderer recurses per tree depth; the
  small tier's 512KB stack overflows around ~100 nesting levels). Very deep component
  trees may need `large`/`xlarge`.
- The page module is evaluated **once per pooled runtime** and reused (module cache) —
  module-scope state persists across requests on the same runtime. Don't rely on module
  scope being fresh per request; per-request state belongs inside `props()`/`Page`.
- Client-side interactivity (`useState`, `onClick`, effects) works after hydration —
  no extra setup.

## SSR page vs SPA vs API route

| Want | Use |
|------|-----|
| Server-rendered HTML, SEO, per-request data | `src/page/*.tsx` (this skill) |
| Client-rendered app shell, no server data | `src/index.tsx` (SPA) |
| JSON/data endpoint | `src/function/api/*.ts` |
