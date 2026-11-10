"use client";

import { useMemo, useState } from "react";
import type { CardProject } from "@/lib/schema";
import { Carousel } from "./Carousel";

/** Tag filter chips + the carousel. Remounts the carousel when the filter changes. */
export function Gallery({ projects }: { projects: CardProject[] }) {
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    // Only tags shared by 2+ projects become chips; every tag still shows on cards.
    return [...counts.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  }, [projects]);
  const shown = tag ? projects.filter((p) => p.tags.includes(tag)) : projects;

  const chip = (label: string, value: string | null) => (
    <button
      key={label}
      type="button"
      aria-pressed={tag === value}
      onClick={() => setTag(value)}
      className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
        tag === value ? "border-accent/60 bg-accent-soft text-fg" : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section aria-labelledby="work-heading" className="pb-24">
      <h2 id="work-heading" className="sr-only">Projects</h2>
      <div role="group" aria-label="Filter by tag" className="-mx-4 mb-10 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0">
        {chip("All", null)}
        {tags.map((t) => chip(t, t))}
      </div>
      <Carousel key={tag ?? "all"} projects={shown} />
    </section>
  );
}
