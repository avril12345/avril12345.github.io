/**
 * Static /projects/<slug>/tour.json: reviewed tour steps with bodies pre-rendered
 * to HTML. The detail page only knows the step count; this file is fetched when a
 * visitor clicks "Start tour".
 */
import { getProject, getProjects } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import type { TourStepView } from "@/lib/schema";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug);
  // Visitors only need the rendered HTML, so the raw markdown body is dropped.
  const steps: TourStepView[] = (project?.tourSteps ?? []).map((s) => ({ ...s, body: "", html: renderMarkdown(s.body) }));
  return Response.json({ steps });
}
