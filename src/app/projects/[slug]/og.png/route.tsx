/** Static /projects/<slug>/og.png: the project's Open Graph / Twitter image. */
import { getProject, getProjects, getSite } from "@/lib/content";
import { renderOg } from "@/lib/og";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p) return new Response("Not found", { status: 404 });
  return renderOg({ eyebrow: getSite().name, title: p.title, subtitle: p.tagline, image: p.poster ?? p.thumbnail });
}
