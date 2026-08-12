# NullJS Template

Starter template for a [NullJS](https://github.com/tothalex/nulljs) application — serverless
JavaScript/TypeScript functions (HTTP routes, cron jobs, event handlers) plus an optional React
SPA, running on pooled QuickJS runtimes.

## Quickstart

Install the `nulljs` binary once (it contains the whole platform — CLI, server, and bundler):

```bash
curl -fsSL https://raw.githubusercontent.com/tothalex/nulljs-public/main/install.sh | sh
```

Then either scaffold a fresh project from this template:

```bash
nulljs create my-app && cd my-app
nulljs dev
```

or work in this repo directly:

```bash
pnpm install
pnpm dev          # runs `nulljs dev`
```

`nulljs dev` starts a full local stack — no bun, no node, no vite — and auto-deploys
everything on save, including the React SPA (the browser live-reloads after each deploy):

| What | Where |
|------|-------|
| Dashboard (logs, invocations, secrets) | http://localhost:3000 |
| Your functions (gateway) | http://nulljs-template.localhost:3001 |
| React SPA | http://nulljs-template.localhost:3001/ |

Try the example route:

```bash
curl http://nulljs-template.localhost:3001/hello
```

Rename the app by changing `name` in `package.json` — it becomes the subdomain.

## Project structure

```
src/
  function/
    api/       HTTP routes — one file per route
    cron/      scheduled functions
    event/     event handlers (async messaging between functions)
  index.tsx    React SPA entry (exports `Page`); delete it if you don't need a UI
  lib/         shared code, bundled into functions that import it
test/cloud/    vitest aliases mapping cloud/* imports to in-memory test doubles
.secret        local secrets (gitignored); copy .secret.example to get started
```

Every function file default-exports a config object with its `handler` — see the examples in
`src/function/` and the full guide in [AGENTS.md](AGENTS.md).

## Runtime modules

Functions import server-provided modules instead of npm packages:
`cloud/postgres` (SQL), `cloud/cache` (KV store), `cloud/got` (HTTP client), `cloud/secret`
(secrets, JWT, password hashing), `cloud/event` (messaging), `cloud/uuid`. Typings ship in
`@tothalex/cloud`.

Note: the runtime is QuickJS with a Node-compat subset — **not Node.js**. There is no `fs` and no
`child_process`.

## Secrets

```bash
cp .secret.example .secret     # then edit values
nulljs secret deploy           # push to the server
```

Functions read secrets from `process.env` and can declare exactly which ones they need via the
`secrets: [...]` config field.

## Testing and deploying

```bash
pnpm test                      # vitest against in-memory cloud/* doubles
nulljs deploy                  # deploy all functions to the selected environment
```

## AI-assisted development

This template is set up for coding agents: `AGENTS.md` (and its `CLAUDE.md` symlink) documents the
platform contract, and `.claude/skills/` contains guides that Claude Code picks up automatically —
just ask for "a new cron job", "an API route", "an event handler", or database/cache/HTTP usage.
