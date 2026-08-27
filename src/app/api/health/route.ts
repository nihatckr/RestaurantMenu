// Lightweight liveness endpoint for uptime monitoring (OPS.md). No DB call — it
// only confirms the app is serving.
export function GET() {
  return Response.json({ status: "ok", ts: new Date().toISOString() });
}
