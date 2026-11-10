import { renderMarkdown } from "@/lib/markdown";

/**
 * The one markdown renderer. Pass `html` when it was pre-rendered at build time
 * (visitors), or `children` to render here (server components, and edit mode).
 */
export function Markdown({ children, html, className = "" }: { children?: string; html?: string; className?: string }) {
  return <div className={`md ${className}`} dangerouslySetInnerHTML={{ __html: html ?? renderMarkdown(children ?? "") }} />;
}
