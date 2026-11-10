"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Html, LiveMarkdown } from "@/components/LiveMarkdown";
import type { TourStep, TourStepView } from "@/lib/schema";

type Props = {
  step: TourStepView;
  index: number;
  total: number;
  /** Frame the percentages are relative to */
  frameRef: RefObject<HTMLDivElement | null>;
  mobile: boolean;
  editing: boolean;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onChange: (patch: Partial<TourStep>) => void;
  onDelete: () => void;
  /** Current video time, for "use current time" in edit mode */
  getVideoTime?: () => number | null;
};

const GAP = 18;
const MARGIN = 8;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(lo, hi), Math.max(lo, v));
const ANCHORS = [
  { side: "top", label: "Above", glyph: "↑" },
  { side: "right", label: "Right", glyph: "→" },
  { side: "bottom", label: "Below", glyph: "↓" },
  { side: "left", label: "Left", glyph: "←" },
] as const;

function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Drag helper with pointer capture, so the cross-origin iframe underneath never steals the gesture. */
function dragHandler(onMove: (dx: number, dy: number) => void) {
  return (e: RPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const el = e.currentTarget;
    const sx = e.clientX;
    const sy = e.clientY;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => onMove(ev.clientX - sx, ev.clientY - sy);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };
}

/** The one guided-tour callout: hotspot + glass card (bottom sheet on mobile). */
export function TourBox({ step, index, total, frameRef, mobile, editing, onNext, onBack, onClose, onChange, onDelete, getVideoTime }: Props) {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const frame = useSize(frameRef);
  const box = useSize(boxRef);
  const titleId = `tour-title-${step.id}`;

  // Focus the card whenever the step changes so keyboard users land in it.
  useLayoutEffect(() => {
    if (!editing) boxRef.current?.focus({ preventScroll: true });
  }, [step.id, editing]);

  const hx = (step.x / 100) * frame.w;
  const hy = (step.y / 100) * frame.h;
  const width = Math.min(step.width, Math.max(160, frame.w - MARGIN * 2));
  const bh = box.h || 160;
  let left = hx + GAP;
  let top = hy - bh / 2;
  if (step.anchor === "left") left = hx - GAP - width;
  if (step.anchor === "top" || step.anchor === "bottom") {
    left = hx - width / 2;
    top = step.anchor === "top" ? hy - GAP - bh : hy + GAP;
  }
  left = clamp(left, MARGIN, frame.w - width - MARGIN);
  top = clamp(top, MARGIN, frame.h - bh - MARGIN);

  const moveBy = (startX: number, startY: number) =>
    dragHandler((dx, dy) => {
      if (!frame.w || !frame.h) return;
      onChange({
        x: Math.round(clamp(startX + (dx / frame.w) * 100, 0, 100) * 10) / 10,
        y: Math.round(clamp(startY + (dy / frame.h) * 100, 0, 100) * 10) / 10,
      });
    });
  const resizeBy = (startW: number) =>
    dragHandler((dx) => onChange({ width: Math.round(clamp(startW + (step.anchor === "left" ? -dx : dx), 160, 520)) }));

  function onKeyDown(e: KeyboardEvent) {
    const typing = (e.target as HTMLElement).closest("input, textarea, select, [contenteditable=true]");
    if (e.key === "Escape") return (e.stopPropagation(), onClose());
    if (typing) return;
    if (e.key === "ArrowRight") return (e.preventDefault(), onNext());
    if (e.key === "ArrowLeft") return (e.preventDefault(), onBack());
  }

  const last = index === total - 1;
  const card = (
    <motion.div
      key={step.id}
      ref={boxRef}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-body`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      initial={reduce ? false : { opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={mobile ? undefined : { left, top, width }}
      className={`pointer-events-auto border border-white/10 bg-[rgb(10_12_16/0.78)] text-sm text-white/80 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.8)] outline-none backdrop-blur-xl backdrop-saturate-150 ${
        mobile ? "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3" : "absolute rounded-xl p-4"
      }`}
    >
      {mobile && <div aria-hidden className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/20" />}

      <div className="mb-2 flex items-center gap-2">
        {editing && !mobile && (
          <button
            type="button"
            aria-label="Drag to move this step"
            title="Drag to move"
            onPointerDown={moveBy(step.x, step.y)}
            className="-ml-1 cursor-grab touch-none rounded px-1 text-white/40 hover:text-white active:cursor-grabbing"
          >
            ⠿
          </button>
        )}
        <span className="font-mono text-[11px] tabular-nums text-white/50">
          {index + 1} / {total}
        </span>
        {step.draft && <span className="rounded border border-amber-300/30 bg-amber-300/10 px-1.5 text-[10px] uppercase tracking-wider text-amber-200">Draft</span>}
        <button type="button" onClick={onClose} aria-label="End tour" className="ml-auto rounded px-1 text-white/50 transition-colors hover:text-white">
          ✕
        </button>
      </div>

      {editing ? (
        <>
          <input
            id={titleId}
            value={step.title}
            onChange={(e) => onChange({ title: e.target.value })}
            aria-label="Step title"
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 font-semibold text-white outline-none focus:border-accent"
          />
          <textarea
            id={`${titleId}-body`}
            value={step.body}
            onChange={(e) => onChange({ body: e.target.value })}
            aria-label="Step body (markdown)"
            rows={4}
            className="mt-2 w-full resize-y rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[12px] leading-relaxed text-white/85 outline-none focus:border-accent"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/60">
            <span className="flex overflow-hidden rounded-md border border-white/10" role="group" aria-label="Callout side">
              {ANCHORS.map((a) => (
                <button
                  key={a.side}
                  type="button"
                  aria-label={a.label}
                  aria-pressed={step.anchor === a.side}
                  onClick={() => onChange({ anchor: a.side })}
                  className={`px-1.5 py-0.5 ${step.anchor === a.side ? "bg-accent-solid text-white" : "hover:bg-white/10"}`}
                >
                  {a.glyph}
                </button>
              ))}
            </span>
            <label className="flex items-center gap-1">
              Video at
              <input
                type="number"
                min={0}
                step={0.5}
                value={step.videoTimestamp ?? ""}
                placeholder="–"
                onChange={(e) => onChange({ videoTimestamp: e.target.value === "" ? undefined : Number(e.target.value) })}
                className="w-14 rounded border border-white/10 bg-white/5 px-1 text-white outline-none focus:border-accent"
              />
              s
            </label>
            {getVideoTime && (
              <button
                type="button"
                onClick={() => {
                  const t = getVideoTime();
                  if (t !== null) onChange({ videoTimestamp: Math.round(t * 10) / 10 });
                }}
                className="rounded border border-white/10 px-1.5 py-0.5 hover:bg-white/10"
              >
                Use current time
              </button>
            )}
            <label className="ml-auto flex items-center gap-1">
              <input type="checkbox" checked={!step.draft} onChange={(e) => onChange({ draft: !e.target.checked })} className="accent-[var(--accent)]" />
              Reviewed
            </label>
            <button type="button" onClick={onDelete} className="rounded px-1 text-red-300/80 hover:text-red-300">
              Delete
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 id={titleId} className="font-semibold text-white">{step.title}</h3>
          <div id={`${titleId}-body`} className="mt-1 leading-relaxed [&_.md_code]:border-white/10 [&_.md_strong]:text-white">
            {step.html ? <Html html={step.html} /> : <LiveMarkdown>{step.body}</LiveMarkdown>}
          </div>
        </>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={onClose} className="mr-auto text-xs text-white/50 transition-colors hover:text-white">
          Skip tour
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={index === 0}
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          Back
        </button>
        <button type="button" onClick={onNext} className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-solid-hover">
          {last ? "Done" : "Next"}
        </button>
      </div>

      {editing && !mobile && (
        <span
          role="separator"
          aria-label="Drag to resize width"
          aria-orientation="vertical"
          onPointerDown={resizeBy(step.width)}
          className={`absolute top-1/2 h-8 w-1.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-full bg-white/25 hover:bg-accent ${step.anchor === "left" ? "-left-1" : "-right-1"}`}
        />
      )}
    </motion.div>
  );

  return (
    <>
      <span
        aria-hidden
        onPointerDown={editing && !mobile ? moveBy(step.x, step.y) : undefined}
        style={{ left: `${step.x}%`, top: `${step.y}%` }}
        className={`absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_4px_var(--accent-soft)] ${editing && !mobile ? "pointer-events-auto cursor-move touch-none" : ""}`}
      >
        <span className="absolute inset-0 rounded-full bg-accent motion-safe:animate-ping" />
      </span>
      {mobile ? (typeof document !== "undefined" ? createPortal(card, document.body) : null) : card}
    </>
  );
}
