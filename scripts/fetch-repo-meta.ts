/**
 * Pulls repo metadata from the GitHub API into content/.generated/repos.json.
 * Runs before `next build` (and `next dev`). Never fails the build: on errors it
 * keeps the previous file, and the detail page simply hides missing metadata.
 *
 * Uses GITHUB_TOKEN when set (GitHub Actions provides one). Skips the network
 * if the file is under an hour old, unless called with --force.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "content/.generated/repos.json");
const PROJECTS = path.join(ROOT, "content/projects");

export type RepoMeta = {
  htmlUrl: string;
  pushedAt: string;
  stars: number;
  languages: { name: string; pct: number }[];
};

const headers: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "portfolio-build",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json() as Promise<T>;
}

async function main() {
  const fresh = fs.existsSync(OUT) && Date.now() - fs.statSync(OUT).mtimeMs < 3_600_000;
  if (fresh && !process.argv.includes("--force")) {
    console.log("repo meta: cached");
    return;
  }
  const previous: Record<string, RepoMeta> = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  const repos = fs
    .readdirSync(PROJECTS)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(PROJECTS, f), "utf8")).repo as string);

  const out: Record<string, RepoMeta> = {};
  for (const repo of repos) {
    try {
      const [info, langs] = await Promise.all([
        get<{ html_url: string; pushed_at: string; stargazers_count: number }>(`https://api.github.com/repos/${repo}`),
        get<Record<string, number>>(`https://api.github.com/repos/${repo}/languages`),
      ]);
      const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
      out[repo] = {
        htmlUrl: info.html_url,
        pushedAt: info.pushed_at,
        stars: info.stargazers_count,
        languages: Object.entries(langs)
          .map(([name, bytes]) => ({ name, pct: Math.round((bytes / total) * 1000) / 10 }))
          .filter((l) => l.pct >= 1)
          .slice(0, 4),
      };
    } catch (e) {
      console.warn(`repo meta: ${repo} failed (${(e as Error).message}); keeping previous`);
      if (previous[repo]) out[repo] = previous[repo];
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`repo meta: ${Object.keys(out).length}/${repos.length} repos`);
}

main().catch((e) => console.warn("repo meta skipped:", e.message));
