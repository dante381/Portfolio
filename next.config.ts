import type { NextConfig } from "next";

// ── CSP notes (Phase 4 tightening) ───────────────────────────────────────────
//
// script-src:
//   'unsafe-inline' is REMOVED. Next.js 16 App Router injects a small inline
//   bootstrap script, but it also emits a `__next_f` nonce attribute when
//   running under a nonce-based CSP. However, nonce injection requires a
//   middleware or server component to generate the nonce per-request and set
//   it on all <script> tags — a significant refactor with Framer Motion (which
//   also needs the nonce). The trade-off chosen for Phase 4:
//     • Remove 'unsafe-eval' (no longer needed — Next 16 prod build uses
//       static chunks, no eval).
//     • Keep 'unsafe-inline' ONLY for style-src (Tailwind CSS injects inline
//       styles; Framer Motion also writes inline styles for animations).
//     • For script-src: remove 'unsafe-inline' and 'unsafe-eval'.
//       Next.js App Router in production does NOT need unsafe-eval.
//       The remaining inline scripts from Next.js are nonce-gated in prod when
//       a nonce header is present; in dev they appear as inline chunks.
//       ACCEPTED RISK (documented): CI/dev builds may log a CSP violation for
//       Next.js's own inline bootstrap script. In production (Vercel), Next
//       applies nonce via middleware — Phase 5 will wire the nonce header.
//       For now, script-src is tightened to 'self' only.
//
// font-src: 'self' only — Google Fonts are loaded via next/font which
//   self-hosts the font files (downloaded at build time). No external CDN
//   request is made at runtime.
//
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
  // Content Security Policy — Phase 4 hardened.
  // Changes from Phase 3:
  //   • script-src: removed 'unsafe-inline' and 'unsafe-eval'
  //   • style-src: keeps 'unsafe-inline' (Tailwind + Framer Motion inline styles)
  //   • font-src: 'self' only (next/font self-hosts Google fonts)
  //   • frame-ancestors: 'none' (equivalent to X-Frame-Options DENY)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self'",
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
