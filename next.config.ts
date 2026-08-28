import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Partial Prerendering / Cache Components: static shell served instantly,
  // per-request bits isolated in <Suspense> leaves (ARCHITECTURE.md).
  cacheComponents: true,

  // The menu lives under /[locale] (I18N.md); send the bare root to the default
  // language. Locale-prefixed URLs are the canonical, shareable ones.
  async redirects() {
    return [{ source: "/", destination: "/tr", permanent: false }];
  },

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

  // Security headers (SECURITY.md §4).
  //
  // CSP is intentionally **static (no nonce)**: a nonce requires per-request
  // dynamic rendering (Next docs), which would defeat this menu's static/PPR
  // shell. The XSS surface is minimal — a read-only menu with no user input and
  // no `dangerouslySetInnerHTML` — so a static policy is the right trade.
  // `'unsafe-inline'` is required for Next's hydration/streaming inline
  // script/style; `'unsafe-eval'` is dev-only (React uses eval for debugging).
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
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
