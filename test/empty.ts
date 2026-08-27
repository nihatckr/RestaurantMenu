// Stub for `server-only` in tests: the real package throws unless resolved
// under the react-server condition, which Vitest doesn't set. Data-access
// modules run fine in the Node test environment.
export {};
