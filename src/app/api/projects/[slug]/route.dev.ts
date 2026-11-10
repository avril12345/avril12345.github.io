/**
 * DEV ONLY: saves a project back to content/projects/<slug>.json.
 * Only exists under `next dev` (see pageExtensions in next.config.ts).
 */
import fs from "node:fs";
import { NextResponse } from "next/server";
import { hashText, projectFilePath } from "@/lib/content";
import { ProjectSchema } from "@/lib/schema";

const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (process.env.NODE_ENV !== "development") return fail(404, "Not found");

  // Only accept saves from pages served by this dev server (blocks cross-site requests).
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host")) return fail(403, "Cross-origin save refused");

  const { slug } = await params;
  let file: string;
  try {
    file = projectFilePath(slug);
  } catch {
    return fail(400, "Bad slug");
  }
  if (!fs.existsSync(file)) return fail(404, `No content/projects/${slug}.json`);

  const body = (await req.json().catch(() => null)) as { project?: unknown; baseHash?: string } | null;
  if (!body?.project) return fail(400, "Missing project");

  if (body.baseHash !== hashText(fs.readFileSync(file, "utf8"))) {
    return fail(409, "The file changed on disk since this page loaded. Reload to get the latest version, then redo your edit.");
  }

  const parsed = ProjectSchema.safeParse(body.project);
  if (!parsed.success) return fail(400, parsed.error.message);
  if (parsed.data.slug !== slug) return fail(400, "Slug can't be changed from edit mode");
  const ids = parsed.data.tourSteps.map((s) => s.id);
  if (new Set(ids).size !== ids.length) return fail(400, "Tour step ids must be unique");

  const text = JSON.stringify(parsed.data, null, 2) + "\n";
  fs.writeFileSync(file, text);
  return NextResponse.json({ hash: hashText(text) });
}
