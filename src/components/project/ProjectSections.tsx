"use client";

import type { ElementType } from "react";
import { Html, LiveMarkdown } from "@/components/LiveMarkdown";
import { ArrowUpRight, GitHubIcon } from "@/components/Icons";
import { Badge, ButtonLink, StatusPill } from "@/components/ui";
import { useProjectCtx } from "./ProjectContext";

const editRing = "rounded-md outline-dashed outline-1 outline-offset-4 outline-accent/50 focus:outline-solid focus:outline-accent";

/** Text that renders plainly for visitors and as a same-looking input in edit mode. */
function EditableText({ field, as: Tag, className, multiline }: { field: "title" | "tagline"; as: ElementType; className: string; multiline?: boolean }) {
  const { project, editing, setField } = useProjectCtx();
  if (!editing) return <Tag className={className}>{project[field]}</Tag>;
  const common = {
    value: project[field],
    "aria-label": field === "title" ? "Project title" : "Tagline",
    onChange: (e: { target: { value: string } }) => setField(field, e.target.value),
    className: `w-full resize-none bg-transparent [field-sizing:content] ${editRing}`,
  };
  return <Tag className={className}>{multiline ? <textarea rows={1} {...common} /> : <input {...common} />}</Tag>;
}

export function ProjectHeader() {
  const { project } = useProjectCtx();
  return (
    <header className="mb-8 mt-6 max-w-3xl">
      <div className="flex items-center gap-3 text-sm text-muted">
        <StatusPill status={project.status} />
        <span>{project.year}</span>
      </div>
      <EditableText field="title" as="h1" className="mt-3 text-3xl font-semibold tracking-tight text-fg md:text-5xl" />
      <EditableText field="tagline" as="p" multiline className="mt-3 text-lg text-muted" />
    </header>
  );
}

export function ProjectAbout() {
  const { project, editing, setField, aboutHtml } = useProjectCtx();
  return (
    <section aria-labelledby="about" className={editing ? "text-muted" : "max-w-prose text-muted"}>
      <h2 id="about" className="mb-4 text-lg font-semibold text-fg">About</h2>
      {editing ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Markdown</span>
            <textarea
              value={project.longDescription}
              onChange={(e) => setField("longDescription", e.target.value)}
              className={`min-h-[420px] w-full bg-surface p-3 font-mono text-[13px] leading-relaxed text-fg [field-sizing:content] ${editRing}`}
            />
          </label>
          <div>
            <span className="mb-1 block text-xs text-muted">Preview</span>
            <LiveMarkdown>{project.longDescription}</LiveMarkdown>
          </div>
        </div>
      ) : aboutHtml ? (
        <Html html={aboutHtml} />
      ) : (
        <LiveMarkdown>{project.longDescription}</LiveMarkdown>
      )}
    </section>
  );
}

export function ProjectLinks() {
  const { project } = useProjectCtx();
  return (
    <div className="flex flex-wrap gap-2">
      <ButtonLink variant="primary" href={project.repoUrl} target="_blank" rel="noopener noreferrer">
        <GitHubIcon /> View code
      </ButtonLink>
      {project.liveUrl && (
        <ButtonLink href={project.liveUrl} target="_blank" rel="noopener noreferrer">
          Live site <ArrowUpRight width={14} height={14} />
        </ButtonLink>
      )}
    </div>
  );
}

export function ProjectTags() {
  const { project } = useProjectCtx();
  return (
    <div>
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">Tech stack</h2>
      <ul className="flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <li key={t}><Badge>{t}</Badge></li>
        ))}
      </ul>
    </div>
  );
}
