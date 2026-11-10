"use client";

import { useEffect } from "react";

/**
 * Shared-element card → detail transition using the View Transitions API.
 * The clicked card's image gets view-transition-name `shot-<slug>`; the detail
 * page's demo poster always carries the same name, so the browser morphs one
 * into the other. Falls back to plain navigation when unsupported or when the
 * user prefers reduced motion.
 */
let pending: (() => void) | null = null;

export const shotName = (slug: string) => `shot-${slug}`;

type DocWithVT = Document & { startViewTransition?: (cb: () => Promise<void>) => unknown };

export function navigateWithTransition(push: (href: string) => void, href: string, el: HTMLElement | null, slug: string) {
  const doc = document as DocWithVT;
  if (!doc.startViewTransition || !el || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    push(href);
    return;
  }
  el.style.viewTransitionName = shotName(slug);
  doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const done = () => {
          pending = null;
          resolve();
        };
        pending = done;
        push(href);
        setTimeout(done, 1500); // never hang if the next page is slow
      }),
  );
}

/** Mount on the destination page: tells the transition the new DOM is ready. */
export function TransitionReady() {
  useEffect(() => {
    pending?.();
  }, []);
  return null;
}
