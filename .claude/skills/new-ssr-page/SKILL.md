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

## Known limitation: stateful UI/animation libraries can crash the server render

**Caution, observed in practice, not theoretical:** components from third-party libraries that
keep their own internal scheduling or animation state across renders can make
`react-dom/server.edge`'s render never complete under QuickJS, throwing a generic, unhelpful
React error (something about a server render not finishing synchronously — misleading if
nothing in the page actually uses Suspense). The identical component tree renders fine under
V8/Node, so this is a QuickJS-specific timing/scheduling difference, not a bug in your JSX. It
has been reproduced independent of which props are passed to the component and independent of
whether the component is instantiated once or many times in a single render pass — so treat any
animation/motion library component as a suspect, not just a specific usage pattern.

A component gated behind client-only state that's `false` during the first server render (e.g.
`{isOpen && <SomeAnimatedThing />}` with `isOpen` starting `false`) sidesteps this entirely, since
it never mounts server-side — that's why a page can use such a library elsewhere without issue.
The fix, when you hit it, is usually to replace the offending element with a plain element and a
CSS transition/animation for the same visual effect — for most simple fades and hover states this
is a straight swap with no visible difference.

**This has not been systematically characterized** — only a couple of specific constructs from
one library have been confirmed; this is a caution to watch for, not a blanket "don't use
animation libraries in SSR pages." If you hit this: the error tells you almost nothing (no
component stack, no indication of which element), so bisect by commenting out chunks of the
page's JSX (binary search) until the render succeeds, then narrow to the specific element.

## SSR page vs SPA vs API route

| Want | Use |
|------|-----|
| Server-rendered HTML, SEO, per-request data | `src/page/*.tsx` (this skill) |
| Client-rendered app shell, no server data | `src/index.tsx` (SPA) |
| JSON/data endpoint | `src/function/api/*.ts` |
