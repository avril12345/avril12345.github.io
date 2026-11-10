import "server-only";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { AboutSchema, ProjectSchema, SiteSchema, type About, type Project, type Site } from "./schema";
import type { RepoMeta } from "../../scripts/fetch-repo-meta";

export type { RepoMeta };

const CONTENT_DIR = path.join(process.cwd(), "content");
export const PROJECTS_DIR = path.join(CONTENT_DIR, "projects");
const REPO_META_FILE = path.join(CONTENT_DIR, ".generated/repos.json");

export function projectFilePath(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Bad slug: ${slug}`);
  return path.join(PROJECTS_DIR, `${slug}.json`);
}

export const hashText = (text: string) => createHash("sha1").update(text).digest("hex");

/** Hash of the file as it is on disk; edit mode uses it to detect outside changes before saving. */
export function projectFileHash(slug: string) {
  return hashText(fs.readFileSync(projectFilePath(slug), "utf8"));
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function getSite(): Site {
  return SiteSchema.parse(readJson(path.join(CONTENT_DIR, "site.json")));
}

export function getAbout(): About {
  return AboutSchema.parse(readJson(path.join(CONTENT_DIR, "about.json")));
}

/** All projects, validated and sorted. Drafts are stripped unless includeDrafts. */
export function getProjects({ includeDrafts = false } = {}): Project[] {
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const result = ProjectSchema.safeParse(readJson(path.join(PROJECTS_DIR, f)));
      if (!result.success) {
        throw new Error(`Invalid content/projects/${f}:\n${result.error.message}`);
      }
      const p = result.data;
      return includeDrafts ? p : { ...p, tourSteps: p.tourSteps.filter((s) => !s.draft) };
    })
    .sort((a, b) => a.order - b.order);
}

export function getProject(slug: string, opts?: { includeDrafts?: boolean }) {
  return getProjects(opts).find((p) => p.slug === slug) ?? null;
}

/** Previous and next project in gallery order (wrapping). */
export function getNeighbors(slug: string) {
  const all = getProjects();
  const i = all.findIndex((p) => p.slug === slug);
  return { prev: all[(i - 1 + all.length) % all.length], next: all[(i + 1) % all.length] };
}

export function getRepoMeta(repo: string): RepoMeta | null {
  if (!fs.existsSync(REPO_META_FILE)) return null;
  return (readJson(REPO_META_FILE) as Record<string, RepoMeta>)[repo] ?? null;
}
