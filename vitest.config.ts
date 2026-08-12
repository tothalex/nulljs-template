import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests resolve the server-provided cloud/* runtime modules to the in-memory
// doubles from @tothalex/cloud/testing (via the shims in test/cloud/).
export default defineConfig({
  test: {
    alias: [
      {
        find: /^cloud\/(.+)$/,
        replacement: fileURLToPath(new URL("./test/cloud/$1.ts", import.meta.url)),
      },
    ],
  },
});
