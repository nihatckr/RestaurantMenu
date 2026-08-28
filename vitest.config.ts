import { defineConfig, configDefaults } from "vitest/config";
import { resolve } from "node:path";

// `@/` path alias (mirrors tsconfig) and a setup file that loads .env so
// integration tests can reach the database via DATABASE_URL.
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
      // `server-only` throws unless resolved under the react-server condition,
      // which Vitest doesn't set — stub it for the Node test environment.
      "server-only": resolve(process.cwd(), "test/empty.ts"),
      // `next/cache` (cacheTag/revalidateTag) needs the Next `cacheComponents`
      // runtime; stub it to no-ops so the DB integration tests can call the
      // data-access functions directly.
      "next/cache": resolve(process.cwd(), "test/next-cache-stub.ts"),
    },
  },
  test: {
    setupFiles: ["./test/setup-env.ts"],
    // Playwright e2e specs live in e2e/ and must not be picked up by Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
