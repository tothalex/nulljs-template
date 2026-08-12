---
name: cloud-modules
description: API reference for NullJS runtime modules — cloud/postgres (SQL database), cloud/cache (key-value store), cloud/got (HTTP client), cloud/secret (secrets + JWT + hashing), cloud/event, cloud/uuid. Use when a function needs a database, cache, outbound HTTP call, secret, JWT, or password hashing.
---

# Cloud modules

Server-provided modules — import them directly, never install npm equivalents (the bundler marks
`cloud/*` as external). Full typings: `node_modules/@tothalex/cloud/src/cloud/*.d.ts`.

## cloud/postgres

```ts
import { pg } from "cloud/postgres";

const db = await pg(process.env.DB_URL!); // pools are cached per connection string

// Tagged template — values are parameterized, never interpolated:
const users = await db.sql<{ id: number; email: string }>`
  SELECT id, email FROM users WHERE created_at > ${since}`;

const one = await db.fetchOne<{ count: number }>("SELECT count(*) count FROM users", []);
const affected = await db.execute("DELETE FROM sessions WHERE expires_at < $1", [now]);

await db.transaction(async (tx) => {
  await tx.sql`INSERT INTO orders (user_id) VALUES (${userId})`;
  await tx.sql`UPDATE inventory SET stock = stock - 1 WHERE sku = ${sku}`;
});
```

Put the connection URL in a secret (`.secret` file → `nulljs secret deploy`), declare it in the
function's `secrets: ["DB_URL"]`, read it from `process.env.DB_URL`.

## cloud/cache

App-scoped shared KV store (all functions of this app see the same data):

```ts
import { cache } from "cloud/cache";

await cache.set("session:123", { userId: 1 }, 60_000); // ttl in MILLISECONDS, omit = no expiry
const value = await cache.get("session:123"); // number | string | boolean | Buffer | object
await cache.remove("session:123");
cache.has("session:123"); // boolean, synchronous
```

## cloud/got

```ts
import got from "cloud/got";

const data = await got.get<{ name: string }>("https://api.example.com/user/1");
const created = await got.post<{ id: string }>("https://api.example.com/items", {
  json: { name: "thing" },          // sets Content-Type: application/json
  headers: { Authorization: `Bearer ${process.env.API_KEY}` },
  timeout: 5000,                    // milliseconds
});
const text = await got.get<string>("https://example.com", { responseType: "text" });
```

Also `got.put`, `got.delete`. Global `fetch` exists too; `got` is the convenience wrapper.

## cloud/secret

```ts
import { secret, jwt } from "cloud/secret";

await secret.store("API_KEY", "value");      // runtime write (usually use `nulljs secret deploy`)
const v = await secret.get("API_KEY");       // app-scoped

const hashed = secret.hash(password);              // Argon2
const ok = secret.verify_hash(password, hashed);

const token = await jwt.sign({ sub: "user-1" }, 3600); // expiry enforced, default 1h
const claims = await jwt.verify(token);                // throws if invalid/expired
```

JWTs are app-scoped: a token signed by one app fails verification in another.

## cloud/event and cloud/uuid

```ts
import { Buffer } from "buffer";
import { send } from "cloud/event";
// Payload must be a Buffer/typed array (plain strings are rejected); handler receives a Buffer.
await send("event-name", Buffer.from(JSON.stringify({ some: "data" })));

import { uuid } from "cloud/uuid";
const id = uuid().toString();
```

## Reminders

- Secrets reach functions as `process.env.NAME` — declare `secrets: ["NAME"]` in the function
  config for least privilege (omitting the field injects all of the app's secrets).
- No `fs`, no `child_process`, not Node — see AGENTS.md "Runtime constraints".
