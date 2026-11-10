"use client";

import { useEffect, type RefObject } from "react";
import { useProjectCtx } from "@/components/project/ProjectContext";
import type { TourStep } from "@/lib/schema";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { TourBox } from "./TourBox";

type Props = {
  frameRef: RefObject<HTMLDivElement | null>;
  /** Called when a step opens, so video mode can seek to its timestamp */
  onStepOpen?: (step: TourStep) => void;
  getVideoTime?: () => number | null;
};

/** Renders the open tour step over the demo frame. Tour state lives in ProjectContext. */
export function Tour({ frameRef, onStepOpen, getVideoTime }: Props) {
  const { visibleSteps, tourIndex, setTourIndex, editing, updateStep, update } = useProjectCtx();
  const mobile = useMediaQuery("(max-width: 767px)");
  const step = tourIndex !== null ? visibleSteps[tourIndex] : undefined;

  useEffect(() => {
    if (step) onStepOpen?.(step);
    // Only when the step changes, not on every edit to it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  // Escape closes the tour even when focus has moved into the demo.
  useEffect(() => {
    if (tourIndex === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTourIndex(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourIndex, setTourIndex]);

  if (!step || tourIndex === null) return null;
  const total = visibleSteps.length;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <TourBox
        key={step.id}
        step={step}
        index={tourIndex}
        total={total}
        frameRef={frameRef}
        mobile={mobile}
        editing={editing}
        onNext={() => setTourIndex(tourIndex < total - 1 ? tourIndex + 1 : null)}
        onBack={() => setTourIndex(Math.max(0, tourIndex - 1))}
        onClose={() => setTourIndex(null)}
        onChange={(patch) => updateStep(step.id, patch)}
        onDelete={() => {
            if (confirm(`Delete step "${step.title}"?`)) update((p) => ({ ...p, tourSteps: p.tourSteps.filter((s) => s.id !== step.id) }));
        }}
        getVideoTime={getVideoTime}
      />
    </div>
  );
}
