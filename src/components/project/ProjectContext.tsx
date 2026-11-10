"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EDIT_MODE } from "@/lib/editMode";
import { ProjectSchema, type Project, type TourStep, type TourStepView } from "@/lib/schema";

// Edit UI is a separate dev-only chunk. The NODE_ENV check is inlined (not EDIT_MODE)
// so webpack folds it to `false` and never emits the chunk in production builds.
const EditToolbar = process.env.NODE_ENV === "development" ? dynamic(() => import("@/components/edit/EditToolbar").then((m) => m.EditToolbar), { ssr: false }) : null;

export type SaveStatus = { kind: "idle" | "saving" | "saved" | "error"; message?: string };

type Ctx = {
  project: Project;
  /** Edit UI is available (dev only) */
  editable: boolean;
  /** Edit UI is switched on; when off, dev shows the page as visitors see it */
  editing: boolean;
  setEditing: (on: boolean) => void;
  update: (fn: (p: Project) => Project) => void;
  setField: <K extends keyof Project>(key: K, value: Project[K]) => void;
  updateStep: (id: string, patch: Partial<TourStep>) => void;
  /** Steps a viewer can see: all of them while editing, reviewed ones otherwise */
  visibleSteps: TourStepView[];
  /** Known before the steps are loaded, for the "Start tour · N steps" label */
  stepCount: number;
  /** Loads the steps if needed (visitors fetch tour.json on first use), then opens step 1 */
  startTour: () => Promise<void>;
  /** About section pre-rendered at build time */
  aboutHtml?: string;
  tourIndex: number | null;
  setTourIndex: (i: number | null) => void;
  dirty: boolean;
  save: () => Promise<void>;
  status: SaveStatus;
};

const ProjectCtx = createContext<Ctx | null>(null);

export function useProjectCtx() {
  const ctx = useContext(ProjectCtx);
  if (!ctx) throw new Error("useProjectCtx must be used inside <ProjectProvider>");
  return ctx;
}

type ProviderProps = { initial: Project; baseHash?: string; tourCount: number; aboutHtml?: string; children: ReactNode };

export function ProjectProvider({ initial, baseHash: initialHash, tourCount, aboutHtml, children }: ProviderProps) {
  const editable = EDIT_MODE;
  const [project, setProject] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [baseHash, setBaseHash] = useState(initialHash ?? "");
  const [editing, setEditingState] = useState(editable);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });
  const [loadedSteps, setLoadedSteps] = useState<TourStepView[] | null>(null);
  const dirty = editable && JSON.stringify(project) !== saved;

  const update = useCallback((fn: (p: Project) => Project) => setProject(fn), []);
  const setField = useCallback(<K extends keyof Project>(key: K, value: Project[K]) => setProject((p) => ({ ...p, [key]: value })), []);
  const updateStep = useCallback(
    (id: string, patch: Partial<TourStep>) => setProject((p) => ({ ...p, tourSteps: p.tourSteps.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
    [],
  );
  const setEditing = useCallback((on: boolean) => {
    setTourIndex(null); // step indexes differ between the two views
    setEditingState(on);
  }, []);

  const visibleSteps = useMemo<TourStepView[]>(() => {
    if (!editable) return loadedSteps ?? [];
    return editing ? project.tourSteps : project.tourSteps.filter((s) => !s.draft);
  }, [editable, editing, loadedSteps, project.tourSteps]);
  const stepCount = editable ? visibleSteps.length : tourCount;

  const startTour = useCallback(async () => {
    if (!editable && !loadedSteps) {
      const res = await fetch(`/projects/${initial.slug}/tour.json`);
      if (!res.ok) return;
      setLoadedSteps(((await res.json()) as { steps: TourStepView[] }).steps);
    }
    setTourIndex(0);
  }, [editable, loadedSteps, initial.slug]);

  // Keep the open step in range after deletes.
  useEffect(() => {
    if (tourIndex !== null && tourIndex >= visibleSteps.length) setTourIndex(visibleSteps.length ? visibleSteps.length - 1 : null);
  }, [tourIndex, visibleSteps.length]);

  const save = useCallback(async () => {
    const check = ProjectSchema.safeParse(project);
    if (!check.success) {
      setStatus({ kind: "error", message: check.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") });
      return;
    }
    setStatus({ kind: "saving" });
    try {
      const res = await fetch(`/api/projects/${project.slug}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, baseHash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status})`);
      setBaseHash(data.hash);
      setSaved(JSON.stringify(project));
      setStatus({ kind: "saved", message: `Saved to content/projects/${project.slug}.json` });
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message });
    }
  }, [project, baseHash]);

  // ⌘S / Ctrl+S to save; warn before leaving with unsaved changes.
  useEffect(() => {
    if (!editable) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [editable, dirty, save]);

  const value: Ctx = {
    project, editable, editing, setEditing, update, setField, updateStep,
    visibleSteps, stepCount, startTour, aboutHtml, tourIndex, setTourIndex, dirty, save, status,
  };

  return (
    <ProjectCtx.Provider value={value}>
      {children}
      {EditToolbar && <EditToolbar />}
    </ProjectCtx.Provider>
  );
}
