"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { CardProject } from "@/lib/schema";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { navigateWithTransition } from "@/lib/viewTransition";
import { ChevronLeft, ChevronRight } from "./Icons";
import { ProjectCard } from "./ProjectCard";

const STEP_DEG = 50; // angle between neighbouring cards on the cylinder
const RADIUS = 470; // cylinder radius in px
const AUTOPLAY_MS = 4500;
const SPRING = { type: "spring", stiffness: 140, damping: 24 } as const;

const mod = (i: number, n: number) => ((i % n) + n) % n;
/** Signed distance from the centre, wrapped into [-n/2, n/2). */
const wrapOffset = (o: number, n: number) => mod(o + n / 2, n) - n / 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Desktop: cards on a cylinder. Neighbours stay fully opaque (so their text keeps its
 * contrast) and are dimmed by a shade layer; cards further round fade out before they
 * wrap, so the loop is seamless.
 */
function cylinder(o: number) {
  const a = o * STEP_DEG;
  const rad = (a * Math.PI) / 180;
  return {
    transform: `translate3d(${Math.sin(rad) * RADIUS}px,0,${(Math.cos(rad) - 1) * RADIUS}px) rotateY(${a}deg)`,
    opacity: clamp(2 - Math.abs(o), 0, 1),
    shade: clamp(Math.abs(o), 0, 1) * 0.5,
  };
}

/** Mobile: a stack. Upcoming cards sit behind, passed cards fly off to the left. */
function stack(o: number) {
  if (o >= 0) {
    return { transform: `translate3d(0,${o * 14}px,0) scale(${1 - o * 0.06})`, opacity: clamp(2.6 - o, 0, 1), shade: clamp(o, 0, 1) * 0.35 };
  }
  return { transform: `translate3d(${o * 115}%,0,0) rotate(${o * 8}deg)`, opacity: clamp(1 + o, 0, 1), shade: 0 };
}

function Slide({ index, n, loop, pos, mobile, children }: { index: number; n: number; loop: boolean; pos: MotionValue<number>; mobile: boolean; children: ReactNode }) {
  const offset = useTransform(pos, (p) => (loop ? wrapOffset(index - p, n) : index - p));
  const layout = useTransform(offset, (o) => (mobile ? stack(o) : cylinder(o)));
  const transform = useTransform(layout, (l) => l.transform);
  const opacity = useTransform(layout, (l) => l.opacity);
  const shade = useTransform(layout, (l) => l.shade);
  const zIndex = useTransform(offset, (o) => Math.round(100 - Math.abs(o) * 10));
  const pointerEvents = useTransform(opacity, (v) => (v < 0.2 ? "none" : "auto"));
  return (
    <motion.div style={{ transform, opacity, zIndex, pointerEvents }} className="absolute inset-x-0 top-0 [backface-visibility:hidden]">
      {children}
      <motion.div aria-hidden style={{ opacity: shade }} className="pointer-events-none absolute inset-0 rounded-2xl bg-bg" />
    </motion.div>
  );
}

export function Carousel({ projects }: { projects: CardProject[] }) {
  const n = projects.length;
  const loop = n >= 4;
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const mobile = useMediaQuery("(max-width: 767px)");
  const pos = useMotionValue(0);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragged = useRef(false);
  const dragStart = useRef(0);
  /** Where the current animation is heading, so rapid key presses accumulate. */
  const target = useRef(0);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const shots = useRef<(HTMLDivElement | null)[]>([]);
  const autoplaying = !reduce && !hovered && !focused && !dragging && n > 1;
  const pxPerCard = mobile ? 300 : 340;

  useMotionValueEvent(pos, "change", (p) => setActive(loop ? mod(Math.round(p), n) : clamp(Math.round(p), 0, n - 1)));

  const goTo = useCallback(
    (to: number) => {
      const t = loop ? to : clamp(to, 0, n - 1);
      target.current = t;
      animate(pos, t, reduce ? { duration: 0 } : SPRING);
    },
    [loop, n, pos, reduce],
  );

  /** Go to a card index by the shortest path round the loop. */
  const goToIndex = useCallback(
    (i: number) => {
      const cur = Math.round(target.current);
      goTo(cur + (loop ? Math.round(wrapOffset(i - mod(cur, n), n)) : i - cur));
    },
    [goTo, loop, n],
  );

  const step = useCallback(
    (dir: 1 | -1, moveFocus = false) => {
      const from = loop ? mod(Math.round(target.current), n) : Math.round(target.current);
      const to = loop ? mod(from + dir, n) : clamp(from + dir, 0, n - 1);
      goToIndex(to);
      if (moveFocus) links.current[to]?.focus({ preventScroll: true });
    },
    [goToIndex, loop, n],
  );

  useEffect(() => {
    if (!autoplaying) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      const next = Math.round(target.current) + 1;
      goTo(!loop && next > n - 1 ? 0 : next);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplaying, goTo, loop, n, pos]);

  function onKeyDown(e: KeyboardEvent) {
    const keys: Record<string, () => void> = {
      ArrowRight: () => step(1, true),
      ArrowLeft: () => step(-1, true),
      Home: () => (goToIndex(0), links.current[0]?.focus({ preventScroll: true })),
      End: () => (goToIndex(n - 1), links.current[n - 1]?.focus({ preventScroll: true })),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    }
  }

  if (n === 0) return <p className="py-24 text-center text-muted">No projects match that filter.</p>;
  const current = projects[active];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Projects"
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocused(false)}
    >
      <motion.div
        className="relative mx-auto h-[400px] w-[min(380px,82vw)] cursor-grab touch-pan-y [perspective:1600px] active:cursor-grabbing md:h-[420px]"
        onPointerDownCapture={() => (dragged.current = false)}
        onPanStart={() => {
          dragged.current = true;
          setDragging(true);
          pos.stop();
          dragStart.current = pos.get();
          target.current = pos.get();
        }}
        onPan={(_, info) => {
          const next = dragStart.current - info.offset.x / pxPerCard;
          pos.set(loop ? next : clamp(next, -0.3, n - 0.7));
        }}
        onPanEnd={(_, info) => {
          setDragging(false);
          goTo(Math.round(pos.get() - (info.velocity.x / pxPerCard) * 0.25));
        }}
      >
        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {projects.map((p, i) => (
            <Slide key={p.slug} index={i} n={n} loop={loop} pos={pos} mobile={mobile}>
              <div role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${p.title}`} aria-hidden={i !== active}>
                <ProjectCard
                  project={p}
                  active={i === active}
                  tabIndex={i === active ? 0 : -1}
                  linkRef={(el) => void (links.current[i] = el)}
                  shotRef={(el) => void (shots.current[i] = el)}
                  priority={i === 0}
                  onFocus={() => i !== active && goToIndex(i)}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let the browser open a new tab
                    e.preventDefault();
                    if (dragged.current) return;
                    if (i !== active) return goToIndex(i); // side card: bring it to the front first
                    navigateWithTransition(router.push, `/projects/${p.slug}/`, shots.current[i], p.slug);
                  }}
                />
              </div>
            </Slide>
          ))}
        </div>
      </motion.div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button type="button" onClick={() => step(-1)} disabled={!loop && active === 0} aria-label="Previous project" className="rounded-full border border-line bg-surface p-2 text-muted transition-colors hover:text-fg disabled:opacity-30">
          <ChevronLeft />
        </button>
        <div className="flex items-center gap-0.5">
          {projects.map((p, i) => (
            // 24px hit area around a small visual dot (WCAG target size)
            <button
              key={p.slug}
              type="button"
              onClick={() => goToIndex(i)}
              aria-label={`Show ${p.title}`}
              aria-current={i === active ? "true" : undefined}
              className="group/dot grid h-6 min-w-6 place-items-center"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-accent" : "w-1.5 bg-line-strong group-hover/dot:bg-muted"}`} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => step(1)} disabled={!loop && active === n - 1} aria-label="Next project" className="rounded-full border border-line bg-surface p-2 text-muted transition-colors hover:text-fg disabled:opacity-30">
          <ChevronRight />
        </button>
      </div>
      <p className="sr-only" aria-live={autoplaying ? "off" : "polite"} aria-atomic>
        {current && `Project ${active + 1} of ${n}: ${current.title}`}
      </p>
    </div>
  );
}
