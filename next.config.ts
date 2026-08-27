import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Partial Prerendering / Cache Components: static shell served instantly,
  // per-request bits isolated in <Suspense> leaves (ARCHITECTURE.md).
  cacheComponents: true,

  // Only optimize images from an explicit host allowlist (SECURITY.md §1).
  // Add real product-image hosts here once the catalog source is decided
  // (DATA_SOURCING.md). Empty = no remote images allowed yet.
  images: {
    remotePatterns: [],
  },

  // Forward browser console errors to the terminal during dev (agent-friendly).
  logging: {
    browserToTerminal: "error",
  },

  // Baseline security headers (SECURITY.md §4). A strict, nonce-based
  // Content-Security-Policy is deferred to T16 hardening (needs middleware to
  // emit per-request nonces for Next's streaming inline scripts).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
