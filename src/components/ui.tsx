import type { AnchorHTMLAttributes, ReactNode } from "react";
import type { Project } from "@/lib/schema";

const STATUS: Record<Project["status"], string> = {
  live: "text-emerald-300 border-emerald-400/25 bg-emerald-400/10 light:text-emerald-700 light:border-emerald-600/25",
  beta: "text-amber-200 border-amber-300/25 bg-amber-300/10 light:text-amber-700 light:border-amber-600/25",
  archived: "text-muted border-line bg-surface",
};

export function StatusPill({ status }: { status: Project["status"] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider backdrop-blur ${STATUS[status]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-md border border-line bg-surface px-2 py-0.5 text-xs text-muted">{children}</span>;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: "primary" | "ghost" };

/** External-or-internal link styled as a button. */
export function ButtonLink({ variant = "ghost", className = "", ...props }: ButtonLinkProps) {
  const styles =
    variant === "primary"
      ? "bg-accent-solid text-white border-accent-solid hover:bg-accent-solid-hover"
      : "bg-surface text-fg border-line hover:border-line-strong hover:bg-surface-strong";
  return (
    <a
      {...props}
      className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${styles} ${className}`}
    />
  );
}
