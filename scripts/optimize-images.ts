/**
 * Converts assets/projects/<slug>/*.png (sources, not deployed) to
 * public/projects/<slug>/*.webp (what the site serves). The PNGs also feed the
 * Open Graph images, since next/og can't read WebP.
 *
 *   npm run images            # all projects
 *   npm run images -- <slug>  # one project
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = path.join(process.cwd(), "assets/projects");
const OUT = path.join(process.cwd(), "public/projects");

export async function optimizeProject(slug: string) {
  const dir = path.join(SRC, slug);
  if (!fs.existsSync(dir)) return;
  fs.mkdirSync(path.join(OUT, slug), { recursive: true });
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".png"))) {
    const src = path.join(dir, f);
    const out = path.join(OUT, slug, f.replace(/\.png$/, ".webp"));
    await sharp(src).webp({ quality: 78, effort: 5 }).toFile(out);
    const kb = (p: string) => Math.round(fs.statSync(p).size / 1024);
    console.log(`  ${slug}/${f}: ${kb(src)} kB → ${path.basename(out)} ${kb(out)} kB`);
  }
}

if (process.argv[1]?.includes("optimize-images")) {
  const only = process.argv[2];
  const slugs = only ? [only] : fs.readdirSync(SRC);
  (async () => {
    for (const s of slugs) await optimizeProject(s);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
