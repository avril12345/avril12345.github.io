"use client";

/**
 * DEV ONLY. Floating edit toolbar + side panel (project details and tour steps).
 * Loaded through next/dynamic behind EDIT_MODE, so production pages never fetch it.
 */
import { useState, type ReactNode } from "react";
import { useProjectCtx } from "@/components/project/ProjectContext";
import type { Project, TourStep } from "@/lib/schema";

type Panel = "details" | "steps" | null;

export function EditToolbar() {
  const { editing, setEditing, dirty, save, status } = useProjectCtx();
  const [panel, setPanel] = useState<Panel>(null);
  const toggle = (p: Exclude<Panel, null>) => setPanel((cur) => (cur === p ? null : p));

  const statusText =
    status.kind === "saving" ? "Saving…" : status.kind === "error" ? status.message : dirty ? "Unsaved changes" : status.kind === "saved" ? "Saved" : "No changes";

  return (
    <>
      {panel && editing && <SidePanel panel={panel} setPanel={setPanel} />}
      <div role="toolbar" aria-label="Edit mode" className="fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 rounded-2xl border border-line-strong bg-elev/85 p-1.5 text-sm shadow-soft backdrop-blur-xl">
        <span className="flex items-center gap-1.5 px-2 font-mono text-[11px] uppercase tracking-wider text-amber-200">
          <span className="size-1.5 rounded-full bg-amber-300" aria-hidden /> Local edit
        </span>
        <ToolButton pressed={editing} onClick={() => setEditing(!editing)} title="Off = preview what visitors see (drafts hidden)">
          {editing ? "Editing" : "Preview"}
        </ToolButton>
        {editing && (
          <>
            <ToolButton pressed={panel === "details"} onClick={() => toggle("details")}>Details</ToolButton>
            <ToolButton pressed={panel === "steps"} onClick={() => toggle("steps")}>Tour steps</ToolButton>
          </>
        )}
        <span
          role="status"
          title={status.message}
          className={`max-w-[16rem] truncate px-2 text-xs ${status.kind === "error" ? "text-red-300" : dirty ? "text-amber-200" : "text-muted"}`}
        >
          {statusText}
        </span>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || status.kind === "saving"}
          title="Save (Ctrl/⌘+S)"
          className="rounded-xl bg-accent-solid px-3.5 py-1.5 font-medium text-white transition-colors hover:bg-accent-solid-hover disabled:bg-surface-strong disabled:text-muted"
        >
          Save
        </button>
        <PublishButton />
      </div>
    </>
  );
}

type PublishState =
  | { kind: "closed" }
  | { kind: "loading" }
  | { kind: "open"; files: string[]; actions: string | null }
  | { kind: "publishing"; files: string[]; actions: string | null }
  | { kind: "done"; sha: string; actions: string | null }
  | { kind: "error"; message: string };

/** Commits saved content (content/, images) and pushes; GitHub Actions then redeploys the site. */
function PublishButton() {
  const { project, dirty } = useProjectCtx();
  const [state, setState] = useState<PublishState>({ kind: "closed" });
  const [message, setMessage] = useState(`Update ${project.title} content`);

  async function open() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/publish/");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState({ kind: "open", files: data.files, actions: data.actions });
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message });
    }
  }

  async function publish(files: string[], actions: string | null) {
    setState({ kind: "publishing", files, actions });
    try {
      const res = await fetch("/api/publish/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState({ kind: "done", sha: data.sha, actions: data.actions });
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message });
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (state.kind === "closed" ? void open() : setState({ kind: "closed" }))}
        disabled={dirty}
        title={dirty ? "Save first, then publish" : "Commit saved content and push to GitHub"}
        aria-expanded={state.kind !== "closed"}
        className="rounded-xl border border-line px-3 py-1.5 text-fg transition-colors hover:border-line-strong disabled:opacity-40"
      >
        Publish
      </button>
      {state.kind !== "closed" && (
        <div role="dialog" aria-label="Publish changes" className="absolute bottom-full right-0 mb-2 w-80 rounded-xl border border-line-strong bg-elev p-4 text-sm shadow-soft">
          {state.kind === "loading" && <p className="text-muted">Checking for changes…</p>}
          {(state.kind === "open" || state.kind === "publishing") &&
            (state.files.length === 0 ? (
              <p className="text-muted">Nothing to publish. Saved changes appear here once they differ from the last commit.</p>
            ) : (
              <>
                <p className="mb-2 font-medium text-fg">{state.files.length} changed file{state.files.length === 1 ? "" : "s"}</p>
                <ul className="mb-3 max-h-32 space-y-0.5 overflow-y-auto font-mono text-[11px] text-muted">
                  {state.files.map((f) => <li key={f} className="truncate">{f}</li>)}
                </ul>
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">Commit message</span>
                  <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} className={input} />
                </label>
                <p className="mt-2 text-[11px] text-muted">Commits only content and images, then pushes. The live site updates in about 2 minutes.</p>
                <button
                  type="button"
                  disabled={state.kind === "publishing" || !message.trim()}
                  onClick={() => void publish(state.files, state.actions)}
                  className="mt-3 w-full rounded-lg bg-accent-solid px-3 py-1.5 font-medium text-white hover:bg-accent-solid-hover disabled:opacity-50"
                >
                  {state.kind === "publishing" ? "Publishing…" : "Commit & push"}
                </button>
              </>
            ))}
          {state.kind === "done" && (
            <p role="status" className="text-fg">
              Pushed <code className="font-mono">{state.sha}</code>. The site redeploys in about 2 minutes.
              {state.actions && (
                <a href={state.actions} target="_blank" rel="noopener noreferrer" className="mt-2 block text-accent-strong underline underline-offset-4">
                  Watch the deploy ↗
                </a>
              )}
            </p>
          )}
          {state.kind === "error" && <p role="alert" className="whitespace-pre-wrap text-red-300">{state.message}</p>}
        </div>
      )}
    </div>
  );
}

function ToolButton({ pressed, onClick, title, children }: { pressed: boolean; onClick: () => void; title?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      title={title}
      className={`rounded-xl px-3 py-1.5 transition-colors ${pressed ? "bg-surface-strong text-fg" : "text-muted hover:text-fg"}`}
    >
      {children}
    </button>
  );
}

function SidePanel({ panel, setPanel }: { panel: Exclude<Panel, null>; setPanel: (p: Panel) => void }) {
  return (
    <aside
      aria-label={panel === "details" ? "Project details" : "Tour steps"}
      className="fixed inset-y-3 right-3 z-40 flex w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-line-strong bg-elev/90 shadow-soft backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-semibold text-fg">{panel === "details" ? "Project details" : "Tour steps"}</h2>
        <button type="button" onClick={() => setPanel(null)} aria-label="Close panel" className="text-muted hover:text-fg">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-24">{panel === "details" ? <DetailsForm /> : <StepsList />}</div>
    </aside>
  );
}

const input = "w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-fg outline-none transition-colors focus:border-accent";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted/80">{hint}</span>}
    </label>
  );
}

function DetailsForm() {
  const { project, setField } = useProjectCtx();
  const [tags, setTags] = useState(project.tags.join(", "));
  const text = (key: "title" | "tagline" | "description", rows?: number) =>
    rows ? (
      <textarea rows={rows} value={project[key]} onChange={(e) => setField(key, e.target.value)} className={input} />
    ) : (
      <input value={project[key]} onChange={(e) => setField(key, e.target.value)} className={input} />
    );
  const nullable = (key: "liveUrl" | "videoUrl" | "previewUrl" | "poster" | "thumbnail") => (
    <input value={project[key] ?? ""} placeholder="none" onChange={(e) => setField(key, e.target.value.trim() || null)} className={input} />
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">Title, tagline and the long description can also be edited directly on the page.</p>
      <Field label="Title">{text("title")}</Field>
      <Field label="Tagline">{text("tagline", 2)}</Field>
      <Field label="Short description" hint="Used on cards and in link previews.">{text("description", 3)}</Field>
      <Field label="Tags" hint="Comma-separated. Tags on 2+ projects become filter chips.">
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          onBlur={() => setField("tags", tags.split(",").map((t) => t.trim()).filter(Boolean))}
          className={input}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Year">
          <input type="number" value={project.year} onChange={(e) => setField("year", Number(e.target.value))} className={input} />
        </Field>
        <Field label="Status">
          <select value={project.status} onChange={(e) => setField("status", e.target.value as Project["status"])} className={input}>
            <option value="live">live</option>
            <option value="beta">beta</option>
            <option value="archived">archived</option>
          </select>
        </Field>
      </div>
      <Field label="Live URL">{nullable("liveUrl")}</Field>
      <label className="flex items-center gap-2 text-sm text-fg">
        <input type="checkbox" checked={project.embeddable} onChange={(e) => setField("embeddable", e.target.checked)} className="accent-[var(--accent)]" />
        Embeddable in an iframe
      </label>
      <Field label="Video URL" hint="/videos/<slug>.mp4, or a YouTube / Loom link.">{nullable("videoUrl")}</Field>
      <Field label="Card preview loop" hint="Optional short muted clip, e.g. /videos/<slug>-loop.mp4.">{nullable("previewUrl")}</Field>
      <Field label="Poster image">{nullable("poster")}</Field>
      <Field label="Thumbnail">{nullable("thumbnail")}</Field>
    </div>
  );
}

function StepsList() {
  const { project, update, setTourIndex, tourIndex } = useProjectCtx();
  const steps = project.tourSteps;
  const setSteps = (fn: (s: TourStep[]) => TourStep[]) => update((p) => ({ ...p, tourSteps: fn(p.tourSteps) }));
  const move = (i: number, dir: -1 | 1) =>
    setSteps((s) => {
      const next = [...s];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  const add = () => {
    const id = `step-${Date.now().toString(36)}`;
    setSteps((s) => [...s, { id, title: "New step", body: "Describe what to look at here.", x: 50, y: 50, width: 280, anchor: "right", draft: true }]);
    setTourIndex(steps.length);
  };
  const drafts = steps.filter((s) => s.draft).length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        {steps.length} steps · {drafts} draft. Drafts are hidden from visitors. Open a step to drag, resize and edit it on the demo.
      </p>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={s.id} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${tourIndex === i ? "border-accent/60 bg-accent-soft" : "border-line bg-surface"}`}>
            <span className="w-5 text-right font-mono text-[11px] text-muted">{i + 1}</span>
            <button type="button" onClick={() => setTourIndex(i)} className="min-w-0 flex-1 truncate text-left text-sm text-fg hover:underline">
              {s.title}
            </button>
            <label title="Reviewed (visible to visitors)" className="flex items-center gap-1 text-[11px] text-muted">
              <input
                type="checkbox"
                checked={!s.draft}
                onChange={(e) => setSteps((all) => all.map((x) => (x.id === s.id ? { ...x, draft: !e.target.checked } : x)))}
                className="accent-[var(--accent)]"
              />
              {s.draft ? "Draft" : "Live"}
            </label>
            <button type="button" aria-label={`Move ${s.title} up`} disabled={i === 0} onClick={() => move(i, -1)} className="px-1 text-muted hover:text-fg disabled:opacity-30">↑</button>
            <button type="button" aria-label={`Move ${s.title} down`} disabled={i === steps.length - 1} onClick={() => move(i, 1)} className="px-1 text-muted hover:text-fg disabled:opacity-30">↓</button>
            <button
              type="button"
              aria-label={`Delete ${s.title}`}
              onClick={() => confirm(`Delete step "${s.title}"?`) && setSteps((all) => all.filter((x) => x.id !== s.id))}
              className="px-1 text-red-300/70 hover:text-red-300"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <button type="button" onClick={add} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg hover:border-line-strong">+ Add step</button>
        {drafts > 0 && (
          <button type="button" onClick={() => setSteps((all) => all.map((x) => ({ ...x, draft: false })))} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-fg">
            Mark all reviewed
          </button>
        )}
      </div>
    </div>
  );
}
