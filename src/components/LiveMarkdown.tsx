"use client";

import dynamic from "next/dynamic";

/**
 * Renders markdown in the browser. Only exists in dev (edit mode live preview);
 * visitors get HTML pre-rendered at build time, so `marked` never ships to them.
 */
export const LiveMarkdown =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./Markdown").then((m) => m.Markdown))
    : function LiveMarkdownUnavailable() {
        return null;
      };

/** Pre-rendered HTML from the build. */
export function Html({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
