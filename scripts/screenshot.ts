/**
 * Captures poster (1440x900) and thumbnail (720x450) images for a project.
 *
 *   npm run shots                      # every project with a liveUrl
 *   npm run shots -- <slug> [source]   # one project; source = URL, local .html, or an existing image
 *
 * Output: assets/projects/<slug>/{poster,thumb}.png (sources) → public/projects/<slug>/*.webp (served)
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Page } from "@playwright/test";
import { optimizeProject } from "./optimize-images";

const ROOT = process.cwd();
const PROJECTS = path.join(ROOT, "content/projects");

function toUrl(source: string) {
  return /^https?:\/\//.test(source) ? source : pathToFileURL(path.resolve(source)).href;
}

async function load(page: Page, source: string) {
  if (/\.(png|jpe?g|webp)$/i.test(source)) {
    // Frame an existing screenshot so it crops the same way as a live capture.
    // Inline as a data URI: setContent pages can't read file:// URLs.
    const ext = path.extname(source).slice(1).replace("jpg", "jpeg");
    const data = `data:image/${ext};base64,${fs.readFileSync(source).toString("base64")}`;
    await page.setContent(
      `<body style="margin:0;background:#000"><img src="${data}" style="width:100vw;height:100vh;object-fit:cover;object-position:top"></body>`,
    );
    await page.waitForLoadState("networkidle");
    return;
  }
  await page.goto(toUrl(source), { waitUntil: "networkidle", timeout: 60_000 });
  // Dismiss first-visit tours/modals the demo may open on load.
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(1200);
}

async function capture(slug: string, source: string) {
  const out = path.join(ROOT, "assets/projects", slug);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const [file, scale] of [["poster.png", 1], ["thumb.png", 0.5]] as const) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: scale, colorScheme: "dark" });
      await load(page, source);
      await page.screenshot({ path: path.join(out, file) });
      await page.close();
    }
    await optimizeProject(slug);
    console.log(`✓ ${slug} ← ${source}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const [slug, source] = process.argv.slice(2);
  if (slug) {
    const fallback = JSON.parse(fs.readFileSync(path.join(PROJECTS, `${slug}.json`), "utf8")).liveUrl;
    if (!source && !fallback) throw new Error(`${slug} has no liveUrl; pass a source`);
    return capture(slug, source ?? fallback);
  }
  for (const f of fs.readdirSync(PROJECTS).filter((f) => f.endsWith(".json"))) {
    const p = JSON.parse(fs.readFileSync(path.join(PROJECTS, f), "utf8"));
    if (p.liveUrl) await capture(p.slug, p.liveUrl).catch((e) => console.warn(`✗ ${p.slug}: ${e.message}`));
    else console.log(`– ${p.slug}: no liveUrl, skipped`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
