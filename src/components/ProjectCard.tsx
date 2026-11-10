"use client";

import Link from "next/link";
import { useRef, type MouseEvent, type PointerEvent, type Ref } from "react";
import type { CardProject } from "@/lib/schema";
import { Poster } from "./Poster";
import { StatusPill } from "./ui";

type Props = {
  project: CardProject;
  active?: boolean;
  tabIndex?: number;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  onFocus?: () => void;
  linkRef?: Ref<HTMLAnchorElement>;
  shotRef?: Ref<HTMLDivElement>;
  /** Load the thumbnail eagerly (the first visible card is the page's LCP image) */
  priority?: boolean;
};

const MAX_TILT = 5; // degrees

/** The one project card, used by the carousel (desktop cylinder and mobile stack). */
export function ProjectCard({ project, active = true, tabIndex, onClick, onFocus, linkRef, shotRef, priority }: Props) {
  const tiltRef = useRef<HTMLDivElement>(null);
  // Muted looping preview (a short dedicated clip, never the full walkthrough), front card only.
  const preview = active && project.previewUrl ? project.previewUrl : null;

  // Hover tilt + light sheen via CSS variables: no React re-renders, mouse/pen only.
  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = tiltRef.current;
    if (!el || e.pointerType === "touch" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * MAX_TILT * 2}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * MAX_TILT * 2}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }
  function onLeave() {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      ref={tiltRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group/card [transform:perspective(900px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] transition-transform duration-300 ease-out"
    >
      <Link
        ref={linkRef}
        href={`/projects/${project.slug}/`}
        onClick={onClick}
        onFocus={onFocus}
        tabIndex={tabIndex}
        draggable={false}
        className={`relative block select-none overflow-hidden rounded-2xl border bg-elev shadow-soft transition-[border-color,box-shadow] duration-300 ${
          active ? "border-line-strong" : "border-line"
        } hover:border-accent/50 hover:shadow-[0_30px_70px_-30px_var(--accent-soft)] focus-visible:border-accent`}
      >
        <div className="relative">
          <Poster ref={shotRef} project={project} variant="thumb" priority={priority} className="aspect-[16/10] border-b border-line" />
          {preview && (
            <video src={preview} muted loop autoPlay playsInline preload="none" aria-hidden className="absolute inset-0 size-full object-cover object-top motion-reduce:hidden" />
          )}
          <div className="absolute left-3 top-3">
            <StatusPill status={project.status} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold tracking-tight text-fg">{project.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{project.tagline}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tech">
            {project.tags.slice(0, 3).map((t) => (
              <li key={t} className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted">
                {t}
              </li>
            ))}
          </ul>
        </div>
        {/* Sheen that follows the pointer */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 [background:radial-gradient(400px_circle_at_var(--mx,50%)_var(--my,0%),rgb(255_255_255/0.07),transparent_40%)] group-hover/card:opacity-100"
        />
      </Link>
    </div>
  );
}
