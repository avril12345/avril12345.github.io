# avril12345.github.io

My portfolio of tools and dashboards: a rotating gallery of projects, each with a live demo or video walkthrough in a browser frame, and an optional guided tour.

**Live:** https://avril12345.github.io

Built with Next.js (App Router, static export), TypeScript, Tailwind CSS and Framer Motion. There is no backend: every page is a static file on GitHub Pages, and all content lives in this repo.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000, with edit mode on
```

| Command | What it does |
|---|---|
| `npm run dev` | Local site with **edit mode** (only exists here, never on the live site) |
| `npm run build` | Fetches GitHub repo metadata, then builds the static site into `out/` |
| `npm run validate` | Checks every content file (schema, file paths, step ids) |
| `npm run shots -- <slug> [url]` | Screenshots a live site into a thumbnail + poster |
| `npm run images` | Converts PNG screenshots in `assets/` to the WebP files the site serves |
| `npm run meta` | Refreshes GitHub repo metadata now (otherwise cached for an hour) |

> Don't run `npm run build` while `npm run dev` is running: they share the `.next/` folder.

## Where things live

```
content/
  site.json                  name, intro, GitHub / LinkedIn / email
  projects/<slug>.json       one file per project (text, links, video, tour steps)
assets/projects/<slug>/      PNG screenshot sources (not deployed)
public/projects/<slug>/      WebP images the site serves
public/videos/               self-hosted demo videos (create when needed)
src/                         the site itself
.github/workflows/deploy.yml build + deploy on every push to main
```

## Add a project

1. Create `content/projects/<slug>.json`. The quickest way is to copy an existing file. The slug becomes the URL `/projects/<slug>/` and must match the file name (lowercase, digits, dashes).
2. Fill in the fields:

   | Field | Notes |
   |---|---|
   | `order` | Position in the gallery (ascending) |
   | `title`, `tagline`, `description` | `description` is the one- or two-sentence version used on cards and link previews |
   | `longDescription` | Markdown, shown in the About section |
   | `tags` | Tech stack. Tags shared by 2+ projects become filter chips |
   | `year`, `status` | `status` is `live`, `beta` or `archived` |
   | `repo`, `repoUrl` | `repo` is `owner/name`; it pulls last-updated and languages from GitHub at build time |
   | `liveUrl`, `embeddable` | Set `embeddable: true` only if the site can be shown in an iframe (GitHub Pages sites and Streamlit apps can) |
   | `embedUrl` | Optional iframe address when it differs from `liveUrl`. For Streamlit apps, use `https://<app>.streamlit.app/?embed=true` |
   | `videoUrl` | `/videos/<slug>.mp4`, or a YouTube / Loom link |
   | `previewUrl` | Optional short muted loop for the gallery card |
   | `poster`, `thumbnail` | `/projects/<slug>/poster.webp` and `thumb.webp` |
   | `tourSteps` | Can start as `[]`; add them in edit mode |

3. Add images. If the project has a live site, run `npm run shots -- <slug>`. Otherwise use an existing screenshot: `npm run shots -- <slug> path/to/screenshot.png`. Projects without images get a generated title card automatically.
4. Run `npm run validate`, then check it in `npm run dev`.

## Record a demo video

Every project falls back to its video when the live site can't be embedded or doesn't load, so a video is worth having even for live projects.

**Recording**
- Record just the browser window at **1440 × 900** (16:10, the same shape as the demo frame). Use a clean browser profile at 100% zoom, with no bookmarks bar or extensions showing.
- Keep it to **1–3 minutes**. Move the mouse slowly and pause for a second on each thing you'd point out. Those pauses become your tour step timestamps.
- Don't record audio, or add captions if you narrate. Card previews always play muted.

**Exporting** (with [ffmpeg](https://ffmpeg.org))

```bash
# Walkthrough: H.264 MP4, 30 fps, fast start (plays before it's fully downloaded)
ffmpeg -i raw.mov -vf "scale=1440:-2,fps=30" -c:v libx264 -crf 26 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an public/videos/<slug>.mp4

# Card preview loop: 6–8 seconds, smaller, no audio (~1–2 MB)
ffmpeg -ss 00:00:05 -t 8 -i raw.mov -vf "scale=720:-2,fps=24" -c:v libx264 -crf 30 \
  -pix_fmt yuv420p -movflags +faststart -an public/videos/<slug>-loop.mp4
```

Keep self-hosted walkthroughs **under about 25 MB**. GitHub rejects files over 100 MB, and every visitor downloads the video you host. For anything longer, upload it to YouTube (unlisted is fine) or Loom and paste the link into `videoUrl`; tour timestamps work with both.

## Write and review tour steps

Tour steps are callouts positioned over the demo frame by percentage. The live demo comes from another site, so the tour can't read or click anything inside it. It just points at places on the frame.

- Every step starts as a **draft**. Drafts are visible in edit mode and **hidden from visitors**. The "Start tour" button only appears once a project has at least one reviewed step.
- Each step has: `title`, `body` (markdown), `x` / `y` (the hotspot target, 0–100% of the frame), `width` (px), `anchor` (which side of the hotspot the callout sits on), optional `videoTimestamp` (seconds; in video mode the video jumps there when the step opens), and `draft`.
- Write each step about what to look at, not how the code works. One or two sentences is plenty.

## Edit mode

Run `npm run dev` and open any project page. A toolbar appears at the bottom. It exists only when running locally, and the live site has no edit controls or save endpoint at all.

- **Title, tagline and About:** edit directly on the page. About has a live markdown preview.
- **Details:** short description, tags, year, status, links, video, preview loop and images.
- **Tour steps:** reorder, add, delete, or "Mark all reviewed". Click a step to open it on the demo, then:
  - drag the **⠿** handle (or the dot) to move it,
  - drag the bar on the box's edge to resize it,
  - edit the title and body in place, pick the side with the arrows, and set the video time (or use **Use current time** while the video plays),
  - tick **Reviewed** to make it visible to visitors.
- **Preview:** toggle it to see the page exactly as visitors will, with drafts hidden.
- **Save** (Ctrl/⌘+S) writes the change to `content/projects/<slug>.json`. If the file was changed on disk since the page loaded, Save refuses and asks you to reload, so it never overwrites other edits.
- **Publish** commits your saved content and images (only `content/`, `public/projects/` and `assets/projects/`) and pushes. The live site updates about 2 minutes later.

You can also edit a project's `.json` file straight on github.com (pencil icon → commit). That deploys the same way.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: install → validate → build → deploy to GitHub Pages. It also rebuilds weekly so the repo "last updated" dates stay current. Watch runs under the repo's **Actions** tab.

First-time setup (already done for this repo):
1. Create the public repo `avril12345.github.io` and push this folder to `main`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**

Because this is a user site at the domain root, no base path is needed.

## Turning on GitHub Pages for a project repo

Only static sites can run on GitHub Pages. Server apps (Python, Node) need another host, or a video.

| Repo | Pages? | How |
|---|---|---|
| Committee-dashboard | ✅ | Settings → Pages → Deploy from a branch → `main` / `(root)` → Save. No build step or base path needed. Then set the repo's homepage to `https://avril12345.github.io/Committee-dashboard/`. |
| PersonalBrandingAgency_Demo | ⚠️ `site/` only | Add `base: '/PersonalBrandingAgency_Demo/'` to `site/vite.config.ts`, then add a workflow that runs `npm ci && npm run build` in `site/` and uploads `site/dist`. Set Pages → Source: GitHub Actions. The CRM itself needs Node; the live demo is the claude.ai artifact instead. |
| SpruceDemoV3 | ❌ Streamlit | ✅ Live on Streamlit Community Cloud: https://sprucedemov3.streamlit.app, embedded via `?embed=true`. Keep an Anthropic spend limit set. |
| Reservoir | ❌ Streamlit + GeoPandas | ✅ Live on Streamlit Community Cloud: https://reservoir-demo.streamlit.app, embedded via `?embed=true`. |

Streamlit Community Cloud's free tier puts apps to sleep after a period with no visitors. A visitor who arrives then sees Streamlit's "get this app back up" button inside the frame, and the app takes about 30–60 seconds to start. To refresh a Streamlit screenshot, run `npm run shots -- <slug>`; the script wakes the app and retakes any capture that comes out blank.
| shelfshare | ❌ Flask + SQLite | Holds real users' data behind invites, so use a video recorded on a demo account. |

## Notes

- All five demos use **fictional data**.
- Content is validated on every build, so a typo in a JSON file fails the deploy with a clear message instead of publishing a broken page.
- `CLAUDE.md` records the architecture decisions for future AI-assisted sessions.
