import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { securityHeaders } from "./lib/securityHeaders";

export default function nextConfig(phase: string): NextConfig {
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    cacheComponents: true,
    partialPrefetching: true,
    // No anunciar la tecnología del servidor.
    poweredByHeader: false,
    headers: () => [{ source: "/:path*", headers: securityHeaders(dev) }],
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },
  };
}
