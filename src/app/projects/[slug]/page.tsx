import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoViewer } from "@/components/DemoViewer";
import { ChevronLeft, ChevronRight } from "@/components/Icons";
import { ProjectProvider } from "@/components/project/ProjectContext";
import { ProjectAbout, ProjectHeader, ProjectLinks, ProjectTags } from "@/components/project/ProjectSections";
import { getNeighbors, getProject, getProjects, getRepoMeta, projectFileHash } from "@/lib/content";
import { EDIT_MODE } from "@/lib/editMode";
import { renderMarkdown } from "@/lib/markdown";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/projects/${p.slug}/` },
    // Preview image: static og.png route next to this page.
    openGraph: { title: p.title, description: p.tagline, url: `/projects/${p.slug}/`, images: [{ url: `/projects/${p.slug}/og.png`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: p.title, description: p.tagline, images: [`/projects/${p.slug}/og.png`] },
  };
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  // Drafts and the file hash are only loaded for local edit mode.
  const project = getProject(slug, { includeDrafts: EDIT_MODE });
  if (!project) notFound();
  const baseHash = EDIT_MODE ? projectFileHash(slug) : undefined;
  // Visitors get the About section as build-time HTML and only the tour step count;
  // the steps themselves load from tour.json when "Start tour" is clicked.
  const clientProject = EDIT_MODE ? project : { ...project, longDescription: "", tourSteps: [] };
  const aboutHtml = EDIT_MODE ? undefined : renderMarkdown(project.longDescription);
  const meta = getRepoMeta(project.repo);
  const { prev, next } = getNeighbors(slug);

  return (
    <ProjectProvider initial={clientProject} baseHash={baseHash} tourCount={project.tourSteps.length} aboutHtml={aboutHtml}>
    <main id="main" className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:pt-12">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-fg">
        <ChevronLeft width={14} height={14} /> All projects
      </Link>

      <ProjectHeader />

      <DemoViewer />

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ProjectAbout />

        <aside className="space-y-8 lg:sticky lg:top-8 lg:self-start">
          <ProjectLinks />

          <ProjectTags />

          {meta && (
            <div>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">Repository</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Last updated</dt>
                  <dd className="text-fg"><time dateTime={meta.pushedAt}>{dateFmt.format(new Date(meta.pushedAt))}</time></dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Repo</dt>
                  <dd className="truncate"><a href={meta.htmlUrl} className="text-fg underline-offset-4 hover:underline">{project.repo.split("/")[1]}</a></dd>
                </div>
              </dl>
              {meta.languages.length > 0 && (
                <>
                  <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden>
                    {meta.languages.map((l, i) => (
                      <span key={l.name} style={{ width: `${l.pct}%`, opacity: 1 - i * 0.22 }} className="bg-accent" />
                    ))}
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted" aria-label="Languages">
                    {meta.languages.map((l) => (
                      <li key={l.name}><span className="text-fg">{l.name}</span> {l.pct}%</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </aside>
      </div>

      <nav aria-label="More projects" className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
        {[{ p: prev, dir: "Previous" }, { p: next, dir: "Next" }].map(({ p, dir }) => (
          <Link
            key={dir}
            href={`/projects/${p.slug}/`}
            className={`group rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong ${dir === "Next" ? "sm:text-right" : ""}`}
          >
            <span className={`flex items-center gap-1 text-xs text-muted ${dir === "Next" ? "sm:justify-end" : ""}`}>
              {dir === "Previous" && <ChevronLeft width={12} height={12} />}
              {dir}
              {dir === "Next" && <ChevronRight width={12} height={12} />}
            </span>
            <span className="mt-1 block font-medium text-fg">{p.title}</span>
          </Link>
        ))}
      </nav>
    </main>
    </ProjectProvider>
  );
}
