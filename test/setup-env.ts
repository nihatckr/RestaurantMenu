import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env into process.env for tests (Next loads it at runtime; Vitest does
// not). Existing env vars win, so CI can inject DATABASE_URL directly.
try {
  const contents = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of contents.split("\n")) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
} catch {
  // no .env (e.g. CI supplies env directly) — ignore
}
