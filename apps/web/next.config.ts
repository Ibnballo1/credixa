// File: apps/web/next.config.ts
// Purpose: Next.js configuration for the customer/agent-facing app.
//          Includes baseline security headers (OWASP secure-headers
//          requirement from the project brief). Payment/webhook-specific
//          CSP additions land in Phase 4 when Paystack's checkout script
//          is introduced.

import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  transpilePackages: [
    "@credixa/ui",
    "@credixa/auth",
    "@credixa/db",
    "@credixa/lib",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
