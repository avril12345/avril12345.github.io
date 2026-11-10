"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Work" },
  { href: "/about/", label: "About" },
];

/** Header tabs. Project pages count as "Work". */
export function NavTabs() {
  const path = usePathname() ?? "/";
  const active = path.startsWith("/about") ? "/about/" : "/";
  return (
    <nav aria-label="Main" className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5">
      {TABS.map((t) => {
        const on = t.href === active;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`rounded-md px-3 py-1 text-sm transition-colors ${on ? "bg-surface-strong text-fg shadow-soft" : "text-muted hover:text-fg"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
