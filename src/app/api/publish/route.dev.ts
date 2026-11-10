/**
 * DEV ONLY: commits content changes and pushes them, which triggers the deploy workflow.
 * Only exists under `next dev` (see pageExtensions in next.config.ts).
 *
 * GET  → which content files changed, and the repo's Actions URL
 * POST → { message } commits ONLY the content paths below, then pushes
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const exec = promisify(execFile);
/** The only paths Publish ever stages, so stray code changes are never pushed by accident. */
const PATHS = ["content", "public/projects", "assets/projects"];

const git = async (...args: string[]) => (await exec("git", args, { cwd: process.cwd(), windowsHide: true })).stdout.trim();
const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !!origin && new URL(origin).host === req.headers.get("host");
}

async function actionsUrl() {
  const remote = await git("remote", "get-url", "origin").catch(() => "");
  const m = remote.match(/github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?$/);
  return m ? `https://github.com/${m[1]}/actions` : null;
}

async function changedFiles() {
  const out = await git("status", "--porcelain", "--untracked-files=all", "--", ...PATHS);
  return out ? out.split("\n").map((l) => l.slice(3)) : [];
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") return fail(404, "Not found");
  if (!sameOrigin(req) && req.headers.get("sec-fetch-site") !== "same-origin") return fail(403, "Cross-origin request refused");
  try {
    return NextResponse.json({ files: await changedFiles(), actions: await actionsUrl() });
  } catch (e) {
    return fail(500, (e as Error).message);
  }
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return fail(404, "Not found");
  if (!sameOrigin(req)) return fail(403, "Cross-origin publish refused");
  const body = (await req.json().catch(() => null)) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 200) return fail(400, "Commit message must be 1–200 characters");

  try {
    const files = await changedFiles();
    if (!files.length) return fail(400, "Nothing to publish: no content changes since the last commit");
    if (!(await actionsUrl())) return fail(400, "No GitHub remote set up yet (see README → Deploy)");
    await git("add", "--", ...PATHS);
    // `-- <paths>` commits only content, even if other files happen to be staged.
    await git("commit", "-m", message, "--", ...PATHS);
    const sha = await git("rev-parse", "--short", "HEAD");
    await git("push");
    return NextResponse.json({ sha, files, actions: await actionsUrl() });
  } catch (e) {
    const err = e as Error & { stderr?: string };
    return fail(500, (err.stderr || err.message).trim().slice(0, 600));
  }
}
