import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    // Static export for GitHub Pages (user site at the domain root, so no basePath).
    // Not set in dev, so the dev-only save API can run.
    output: dev ? undefined : "export",
    // Emit /projects/<slug>/index.html so Pages serves clean URLs.
    trailingSlash: true,
    images: { unoptimized: true },
    // *.dev.ts(x) files (the content save API) only exist for `next dev`;
    // production builds don't see them as routes at all.
    pageExtensions: dev ? ["tsx", "ts", "dev.ts"] : ["tsx", "ts"],
  };
}
