"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useProjectCtx } from "@/components/project/ProjectContext";
import type { TourStep } from "@/lib/schema";
import { embedAt, parseVideo } from "@/lib/video";
import { shotName, TransitionReady } from "@/lib/viewTransition";
import { BrowserFrame } from "./BrowserFrame";
import { ArrowUpRight, PlayIcon } from "./Icons";
import { Poster } from "./Poster";

// The tour (and framer-motion with it) loads only once someone starts a tour.
const loadTour = () => import("@/components/tour/Tour").then((m) => m.Tour);
const Tour = dynamic(loadTour, { ssr: false });

type Mode = "live" | "video";
type LiveStatus = "idle" | "loading" | "ready" | "failed";

const LOAD_TIMEOUT_MS = 15_000;

/**
 * Live demo (lazy iframe) / video walkthrough inside the browser frame, with the
 * guided tour on top. Falls back to video when the project isn't embeddable or
 * the iframe doesn't load.
 */
export function DemoViewer() {
  const { project, stepCount, startTour, tourIndex, setTourIndex } = useProjectCtx();
  const frameSrc = project.embedUrl ?? project.liveUrl;
  const canLive = project.embeddable && !!frameSrc;
  const video = parseVideo(project.videoUrl);
  const [mode, setMode] = useState<Mode>(canLive ? "live" : "video");
  const [live, setLive] = useState<LiveStatus>("idle");
  const [videoStarted, setVideoStarted] = useState(false);
  const [embedStart, setEmbedStart] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const viewportRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingSeek = useRef<number | null>(null);

  useEffect(() => {
    if (live !== "loading") return;
    timer.current = setTimeout(() => {
      setLive("failed");
      setMode("video");
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer.current);
  }, [live]);

  /** Tour step opened: in video mode, jump to its timestamp. */
  function onStepOpen(step: TourStep) {
    if (mode !== "video" || !video || step.videoTimestamp === undefined) return;
    const t = step.videoTimestamp;
    setVideoStarted(true);
    if (video.kind === "file") {
      const v = videoRef.current;
      if (v && v.readyState >= 1) {
        v.currentTime = t;
        void v.play().catch(() => {});
      } else pendingSeek.current = t;
    } else setEmbedStart(t);
  }

  const getVideoTime = mode === "video" && video?.kind === "file" ? () => videoRef.current?.currentTime ?? null : undefined;

  const address = project.liveUrl ? project.liveUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : `${project.slug} · walkthrough`;
  const showPoster = mode === "live" ? live !== "ready" : !videoStarted;
  const openLive = project.liveUrl && (
    <a
      href={project.liveUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      Open live site <ArrowUpRight width={12} height={12} />
    </a>
  );

  return (
    <div>
      <TransitionReady />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Demo type" className="inline-flex rounded-lg border border-line bg-surface p-0.5">
            {(["live", "video"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                disabled={m === "live" && !canLive}
                title={m === "live" && !canLive ? "This project can't be embedded" : undefined}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  mode === m ? "bg-surface-strong text-fg shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                {m === "live" ? "Live demo" : "Video walkthrough"}
              </button>
            ))}
          </div>
          {live === "failed" && (
            <p role="status" className="text-sm text-amber-200 light:text-amber-700">
              The live demo didn&apos;t load, so here&apos;s the walkthrough.
            </p>
          )}
        </div>
        {stepCount > 0 && (
          <button
            type="button"
            onPointerEnter={() => void loadTour()}
            onFocus={() => void loadTour()}
            onClick={() => (tourIndex === null ? void startTour() : setTourIndex(null))}
            aria-pressed={tourIndex !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:border-accent"
          >
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            {tourIndex === null ? `Start tour · ${stepCount} ${stepCount === 1 ? "step" : "steps"}` : "End tour"}
          </button>
        )}
      </div>

      <BrowserFrame address={address} actions={openLive} viewportRef={viewportRef} overlay={tourIndex !== null && <Tour frameRef={viewportRef} onStepOpen={onStepOpen} getVideoTime={getVideoTime} />}>
        {/* Live iframe: mounted on first request, kept alive while switching modes */}
        {canLive && live !== "idle" && live !== "failed" && (
          <iframe
            src={frameSrc!}
            title={`${project.title}, live demo`}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            referrerPolicy="no-referrer"
            onLoad={() => {
              clearTimeout(timer.current);
              setLive("ready");
            }}
            onError={() => {
              setLive("failed");
              setMode("video");
            }}
            className={`absolute inset-0 size-full bg-white ${mode === "live" && live === "ready" ? "" : "invisible"}`}
          />
        )}

        {mode === "video" && videoStarted && video?.kind === "file" && (
          <video
            ref={videoRef}
            src={video.src}
            poster={project.poster ?? undefined}
            controls
            autoPlay
            playsInline
            onLoadedMetadata={(e) => {
              if (pendingSeek.current !== null) {
                e.currentTarget.currentTime = pendingSeek.current;
                pendingSeek.current = null;
              }
            }}
            className="absolute inset-0 size-full bg-black object-contain"
          />
        )}
        {mode === "video" && videoStarted && video && video.kind !== "file" && (
          <iframe
            key={embedStart ?? "start"}
            src={embedStart !== null ? embedAt(video, embedStart) : `${video.src}&autoplay=1`}
            title={`${project.title}, video walkthrough`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full bg-black"
          />
        )}

        {showPoster && (
          <div className="absolute inset-0">
            <Poster project={project} variant="poster" priority className="size-full" style={{ viewTransitionName: shotName(project.slug) }} />
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/50 via-transparent to-transparent">
              {mode === "live" ? (
                <PosterButton onClick={() => setLive("loading")} busy={live === "loading"} label={live === "loading" ? "Loading live demo…" : "Load live demo"} />
              ) : video ? (
                <PosterButton onClick={() => setVideoStarted(true)} label="Play walkthrough" />
              ) : (
                <div className="mx-4 rounded-xl border border-line bg-bg/70 px-4 py-3 text-center text-sm text-muted backdrop-blur-md">
                  <p className="text-fg">Walkthrough video coming soon</p>
                  {project.liveUrl && <p className="mt-1">Meanwhile, the live site opens in a new tab.</p>}
                  {project.liveUrl && <div className="mt-3 flex justify-center">{openLive}</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </BrowserFrame>
    </div>
  );
}

function PosterButton({ onClick, label, busy }: { onClick: () => void; label: string; busy?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-transform hover:scale-[1.03] disabled:cursor-wait"
    >
      {busy ? <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden /> : <PlayIcon />}
      {label}
    </button>
  );
}
