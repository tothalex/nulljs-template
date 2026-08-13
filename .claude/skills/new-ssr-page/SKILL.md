---
name: new-ssr-page
description: Add a server-side-rendered page (SSR) under src/page/ in React, Svelte, or Solid. Use when the user wants a server-rendered page, SEO-friendly HTML, per-request dynamic HTML, or asks for "SSR".
---

# New SSR page

A file under `src/page/` is a server-side-rendered page — the directory is what makes it
a page (like `src/function/`), one page per file. The server renders it to HTML per
request and the browser hydrates it with the same props. Three frameworks are supported;
the authoring shape differs slightly per framework, everything else (props, routing,
deploys) is identical.

**Choosing:** Svelte and Solid pages render 3–5× faster than React on this platform and
ship much smaller bundles. Pick React when the page needs the React ecosystem; otherwise
prefer Svelte (or Solid if the team thinks in JSX).

## React (`src/page/<name>.tsx`)

```tsx
import { defineReactPage } from "@tothalex/cloud";

type Props = { user: string; count: number };

export const Page = ({ user, count }: Props) => (
  <main>
    <h1>Hi {user}</h1>
    <p>{count} items</p>
  </main>
);

export default defineReactPage<Props>({
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

`definePage` is the deprecated old name for `defineReactPage`.

## Svelte (`src/page/<name>.svelte` + sibling `<name>.ts`)

Two files — a `.svelte` component can't hold the config export. The sibling `.ts` with
the same stem IS the page's config, not a separate function. See `src/page/docs.svelte`
+ `docs.ts` for a working example.

```svelte
<!-- src/page/dashboard.svelte -->
<script lang="ts">
  let { user, count } = $props();
  let clicks = $state(0);
</script>

<main>
  <h1>Hi {user}</h1>
  <p>{count} items</p>
  <button onclick={() => clicks++}>{clicks}</button>
</main>

<style>
  /* scoped, ships as a stylesheet asset automatically */
  main { max-width: 40rem; }
</style>
```

```ts
// src/page/dashboard.ts
import { defineSveltePage } from "@tothalex/cloud";

export default defineSveltePage<{ user: string; count: number }>({
  route: "/dashboard",
  props: async (request) => ({ user: request.query_params.user ?? "you", count: 42 }),
});
```

The config file is optional: a bare `.svelte` page deploys with `name` and `route`
defaulting from the file stem (`dashboard` → `/dashboard`, `index` → `/`).

## Solid (`src/page/<name>.tsx`)

Same single-file shape as React, with two Solid-specific rules: the `defineSolidPage`
call is ALSO how the platform tells a Solid page from a React one (use it exactly once,
in the page file), and **all of the page's JSX must stay in this one file** — locally
imported `.tsx` components would be compiled as React. Start the file with the
`@jsxImportSource` pragma so the type checker uses Solid's JSX types. See
`src/page/board.tsx` for a working example.

```tsx
/** @jsxImportSource solid-js */
import { createSignal } from "solid-js";
import { defineSolidPage } from "@tothalex/cloud";

type Props = { user: string };

export const Page = (props: Props) => {
  const [n, setN] = createSignal(0);
  return <button onClick={() => setN(n() + 1)}>{props.user}: {n()}</button>;
};

export default defineSolidPage<Props>({
  name: "dashboard",
  route: "/dashboard",
  props: async (request) => ({ user: request.query_params.user ?? "you" }),
});
```

## Verify

With `pnpm dev` running, the page deploys on save. Open
`http://<app>.localhost:3001/<route>` — the HTML arrives server-rendered and
live-reloads on save.

## Rules (all frameworks)

- The component must be the framework's expected export: named `Page` for React/Solid,
  the module itself for `.svelte`. The config is always the default export of its file.
- `props` is optional — omit it for a static page (still server-rendered, still SEO-visible).
- Never import a framework's server-rendering entry point yourself; the platform does
  the rendering.
- Server-only code (secrets, `cloud/*`) belongs in `props()` / the config — it is kept
  out of the browser bundle. The page component runs on BOTH server and browser, so it
  must not touch `process.env` or `cloud/*`.
- `size` defaults to `medium` for pages; very deep component trees may need `large`/`xlarge`.
- The page module is evaluated **once per pooled runtime** and reused (module cache) —
  module-scope state persists across requests on the same runtime. Per-request state
  belongs inside `props()` / the component.
- Client-side interactivity (state, event handlers, effects) works after hydration — no
  extra setup.
- Routing: pages own their exact route and win over an SPA catch-all; see the Routing
  section in AGENTS.md for how pages, API routes, and an SPA nest.

## Known limitation (React pages): stateful UI/animation libraries can crash the server render

**Caution, observed in practice, not theoretical:** components from third-party libraries
that keep their own internal scheduling or animation state across renders can make the
React server render never complete, throwing a generic, unhelpful React error (something
about a server render not finishing synchronously — misleading if nothing in the page
actually uses Suspense). The identical component tree renders fine in an ordinary Node
toolchain, so it is a platform-runtime timing/scheduling difference, not a bug in your
JSX. It has been reproduced independent of which props are passed and independent of
whether the component is instantiated once or many times — treat any animation/motion
library component as a suspect, not just a specific usage pattern.

A component gated behind client-only state that's `false` during the first server render
(e.g. `{isOpen && <SomeAnimatedThing />}` with `isOpen` starting `false`) sidesteps this
entirely, since it never mounts server-side. The fix, when you hit it, is usually to
replace the offending element with a plain element and a CSS transition/animation for the
same visual effect.

**This has not been systematically characterized** — only a couple of specific constructs
from one library have been confirmed. If you hit it: the error tells you almost nothing,
so bisect by commenting out chunks of the page's markup (binary search) until the render
succeeds, then narrow to the specific element.

## SSR page vs SPA vs API route

| Want | Use |
|------|-----|
| Server-rendered HTML, SEO, per-request data | `src/page/*` (this skill) |
| Client-rendered app shell, client-side router | `src/index.tsx` / `src/index.svelte` (SPA) |
| JSON/data endpoint | `src/function/api/*.ts` |
