import type { NextConfig } from "next";

// ── CSP notes ─────────────────────────────────────────────────────────────────
//
// script-src 'unsafe-inline': Next.js 16 App Router injects inline bootstrap
// scripts that cannot be hashed (they change per-build) without nonce-based
// CSP. Implementing per-request nonces requires significant middleware + layout
// refactor (Framer Motion and recharts also need the nonce). Trade-off accepted:
// keep 'unsafe-inline' for script-src; remove 'unsafe-eval' (the higher-risk
// directive). XSS risk is mitigated by strict input validation (zod), no
// dangerouslySetInnerHTML on untrusted data, and all other headers in place.
//
// font-src: 'self' only — next/font self-hosts Google Fonts at build time.
// connect-src: 'self' — all API calls are same-origin.
//
const securityHeaders = [
  // HSTS: max-age 1 year, includeSubDomains, preload
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Prevent clickjacking (belt-and-suspenders alongside frame-ancestors in CSP)
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Prevent MIME type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Referrer policy
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Permissions policy - disable camera, microphone, geolocation
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'none'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Remove X-Powered-By header
  poweredByHeader: false,
  // No source maps in production builds
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
