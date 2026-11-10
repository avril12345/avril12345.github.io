/** Validates every content file against the schema. Run: npm run validate */
import fs from "node:fs";
import path from "node:path";
import { ProjectSchema, SiteSchema } from "../src/lib/schema";

const dir = path.join(process.cwd(), "content/projects");
let failed = false;

const site = SiteSchema.safeParse(JSON.parse(fs.readFileSync("content/site.json", "utf8")));
if (!site.success) {
  failed = true;
  console.error("✗ content/site.json\n" + site.error.message);
}

const slugs = new Set<string>();
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const r = ProjectSchema.safeParse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  if (!r.success) {
    failed = true;
    console.error(`✗ ${f}\n${r.error.message}`);
    continue;
  }
  const p = r.data;
  const problems: string[] = [];
  if (`${p.slug}.json` !== f) problems.push(`filename should be ${p.slug}.json`);
  if (slugs.has(p.slug)) problems.push("duplicate slug");
  slugs.add(p.slug);
  if (p.embeddable && !p.liveUrl) problems.push("embeddable without liveUrl");
  // Local files (paths starting with "/") must exist under public/; URLs are not checked.
  for (const file of [p.poster, p.thumbnail, p.videoUrl, p.previewUrl]) {
    if (file?.startsWith("/") && !fs.existsSync(path.join("public", file))) problems.push(`missing public${file}`);
  }
  const ids = p.tourSteps.map((s) => s.id);
  if (new Set(ids).size !== ids.length) problems.push("duplicate tour step ids");
  const drafts = p.tourSteps.filter((s) => s.draft).length;
  if (problems.length) failed = true;
  console.log(`${problems.length ? "✗" : "✓"} ${p.slug} (${p.tourSteps.length} steps, ${drafts} draft)${problems.map((x) => "\n   - " + x).join("")}`);
}

process.exit(failed ? 1 : 0);
