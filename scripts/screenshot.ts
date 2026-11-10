/**
 * Captures a project's poster (1440x900) and thumbnail (720x450).
 *
 *   npm run shots                      # every project with a live site
 *   npm run shots -- <slug> [source]   # one project; source = URL, local .html, or an existing image
 *
 * Uses embedUrl when set (e.g. Streamlit's ?embed=true, which hides Streamlit's own chrome).
 * Sleeping Streamlit apps are woken and given time to render.
 *
 * Output: assets/projects/<slug>/{poster,thumb}.png (sources) → public/projects/<slug>/*.webp (served)
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Page } from "@playwright/test";
import sharp from "sharp";
import { optimizeProject } from "./optimize-images";

const ROOT = process.cwd();
const PROJECTS = path.join(ROOT, "content/projects");

function toUrl(source: string) {
  return /^https?:\/\//.test(source) ? source : pathToFileURL(path.resolve(source)).href;
}

/** Streamlit Cloud: wake the app if it's asleep, then wait until the app frame has real content. */
async function settleStreamlit(page: Page) {
  const deadline = Date.now() + 180_000;
  let woke = false;
  while (Date.now() < deadline) {
    const wake = page.getByRole("button", { name: /get this app back up/i });
    if (!woke && (await wake.count())) {
      console.log("  app is asleep, waking it (this can take a minute)…");
      await wake.click();
      woke = true;
    }
    const app = page.frames().find((f) => f.url().includes("/~/+/"));
    if (app) {
      const text = (await app.locator("body").innerText().catch(() => "")).trim();
      const busy = await app.locator('[data-testid="stStatusWidget"], [data-testid="stSpinner"]').count();
      if (text.length > 300 && !busy) {
        await page.waitForTimeout(5000); // let maps and charts finish drawing
        return;
      }
    }
    await page.waitForTimeout(2000);
  }
  throw new Error("Streamlit app didn't finish loading within 3 minutes");
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
  if (/\.streamlit\.app\b/.test(source)) {
    // Streamlit keeps a live connection open, so "networkidle" never comes.
    await page.goto(source, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await settleStreamlit(page);
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
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
    await load(page, source);
    const poster = path.join(out, "poster.png");
    // Guard against blank captures (apps that are still booting): retake until the image has detail.
    for (let attempt = 1; ; attempt++) {
      await page.screenshot({ path: poster });
      const { channels } = await sharp(poster).stats();
      const detail = channels.slice(0, 3).reduce((a, c) => a + c.stdev, 0) / 3;
      if (detail > 15) break;
      if (attempt === 12) throw new Error("capture still looks blank after 2 minutes");
      console.log(`  capture looks blank (detail ${detail.toFixed(1)}), waiting 10 s…`);
      await page.waitForTimeout(10_000);
    }
    // One capture: the thumbnail is the poster scaled down, so slow apps load once.
    await sharp(poster).resize(720, 450).png().toFile(path.join(out, "thumb.png"));
    await optimizeProject(slug);
    console.log(`✓ ${slug} ← ${source}`);
  } finally {
    await browser.close();
  }
}

type Meta = { slug: string; liveUrl: string | null; embedUrl?: string | null };
const read = (slug: string): Meta => JSON.parse(fs.readFileSync(path.join(PROJECTS, `${slug}.json`), "utf8"));
/** Private claude.ai artifacts need a sign-in, so they can't be captured automatically. */
const capturable = (url: string | null | undefined) => (url && !url.includes("claude.ai/") ? url : null);

async function main() {
  const [slug, source] = process.argv.slice(2);
  if (slug) {
    const p = read(slug);
    const src = source ?? capturable(p.embedUrl ?? p.liveUrl);
    if (!src) throw new Error(`${slug} has no capturable live URL; pass a source (URL, .html or image)`);
    return capture(slug, src);
  }
  for (const f of fs.readdirSync(PROJECTS).filter((f) => f.endsWith(".json"))) {
    const p = read(f.replace(/\.json$/, ""));
    const src = capturable(p.embedUrl ?? p.liveUrl);
    if (src) await capture(p.slug, src).catch((e) => console.warn(`✗ ${p.slug}: ${e.message}`));
    else console.log(`– ${p.slug}: no capturable live URL, skipped`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
