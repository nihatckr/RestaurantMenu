// Centralized tunables/limits — one place for policy numbers instead of magic
// values scattered across the code. Plain constants (no server-only), so both
// client and server modules can import them.
export const config = {
  price: {
    max: 1_000_000, // TRY upper bound for a single price / measure
  },
  image: {
    maxWidth: 1200, // menu photos; keeps blobs small
    webpQuality: 78,
    maxUploadBytes: 8 * 1024 * 1024, // reject oversized images before decoding
  },
  backup: {
    maxUploadBytes: 10 * 1024 * 1024, // .xlsx import size cap
    importErrorLimit: 20, // max row errors shown in the UI
  },
  session: {
    ttlSeconds: 60 * 60 * 8, // admin session lifetime — 8 hours
  },
  login: {
    maxFails: 5, // failed attempts before a lock
    lockMs: 5 * 60 * 1000, // lock duration — 5 minutes
  },
  audit: {
    pageSize: 20, // recent-activity rows shown
  },
} as const;
