# Portfolio — project decisions

Personal portfolio for github.com/avril12345, deployed to https://avril12345.github.io (user site, so **no basePath**).

## Stack
Next.js 15 App Router + TS + Tailwind v4 + Framer Motion, `output: 'export'`. No backend. Content validated with zod.

## Phases (stop for user OK after each)
1. ✅ Plan + content files
2. ✅ Gallery + detail view (smoke-tested against `out/`: keys, wrap, drag, filter, nav, iframe, fallback, 404, mobile overflow)
3. ✅ Tour boxes + edit mode (Playwright-tested in dev: drag, resize, inline edit, review, save, 409, preview, mobile sheet; prod export verified free of edit code/API/drafts)
4. ✅ Design polish + performance (Lighthouse mobile 89–97 perf, 100 a11y/best/SEO; desktop 100)
5. Deploy (repo `avril12345.github.io`, Actions → Pages on push to main)

## Content
- `content/site.json`: name, intro, links (schema `SiteSchema`).
- `content/projects/<slug>.json`: one file per project (schema `ProjectSchema` in `src/lib/schema.ts`). **JSON, not MDX**, so edit mode can round-trip it losslessly; markdown lives in `longDescription` and tour `body` strings.
- `order` sets gallery order. Filename must equal `<slug>.json`.
- Tour step: `x`,`y` = hotspot target in % of the demo frame; `anchor` = side of the hotspot the callout sits on; `width` px. `draft: true` steps are stripped by `getProjects()` unless `includeDrafts`.
- Images: `public/projects/<slug>/poster.png` (1440×900) + `thumb.png` (720×450). Make with `npm run shots -- <slug> [url|html|png]`.
- `npm run validate` checks schema, filenames, image paths, step ids.

## Built so far
- `Carousel`: one `pos` motion value (fractional index) drives both layouts: `cylinder()` (desktop) and `stack()` (mobile <768px). Loops only when n ≥ 4 (back cards fade before wrapping). `target` ref = where the animation is heading, so key presses accumulate. Roving tabindex; side-card click brings it front, active-card click navigates.
- Card→detail transition: `src/lib/viewTransition.ts` (View Transitions API, `shot-<slug>` name). Detail poster always carries the name; `<TransitionReady/>` in DemoViewer resolves it.
- `DemoViewer`: poster until clicked; iframe kept mounted across mode switches; 15 s load timeout → video. Note cross-origin 404s still fire `onLoad`, so they can't be detected.
- Filter chips: only tags shared by ≥ 2 projects.
- `next.config.ts`: `output: 'export'`, `trailingSlash: true`, `images.unoptimized`.
- `npm run meta` forces a repo-metadata refresh (otherwise cached for 1 h).
- LOUD liveUrl is a claude.ai artifact: CSP `frame-ancestors 'self'` → not embeddable; must be shared "anyone with link" for visitors.

## Phase 3: tour + edit mode
- `ProjectProvider` (`components/project/ProjectContext.tsx`) holds the editable project copy, tour index, dirty/save state. Detail page text comes from `ProjectSections.tsx` (header, about, links, tags) so edits preview live.
- Tour: `tour/Tour.tsx` (controller) + `tour/TourBox.tsx` (the one callout). Box placement computed in px from frame size + anchor, clamped inside the frame. Drag/resize use pointer capture so the iframe can't steal events. Mobile (<768px) = bottom sheet via portal.
- Video sync: `DemoViewer.onStepOpen` seeks `<video>` or reloads YouTube/Loom embed with a start time (`lib/video.ts#embedAt`).
- Save API: `src/app/api/projects/[slug]/route.dev.ts`. Only routed in dev via `pageExtensions` (next.config is a phase function; `output: 'export'` only for builds). Checks same-origin, slug regex, sha1 base hash (409 on outside edits), zod, unique step ids. Writes `JSON.stringify(data, null, 2)`.
- Dev-only UI must gate with inline `process.env.NODE_ENV === "development"` (not the `EDIT_MODE` import) so webpack drops the chunk.
- Never run `next build` while `next dev` is running (shared `.next/`).

## Phase 4: load-on-demand + polish
- Markdown: `lib/markdown.ts` (marked; raw HTML escaped, safe links). Visitors get build-time HTML (`aboutHtml` prop; tour `html`). `LiveMarkdown` = dev-only dynamic import for the edit preview. react-markdown removed.
- Tour is lazy: detail page ships only `tourCount`; `/projects/<slug>/tour.json` (static route, reviewed steps, HTML only) + the Tour chunk (with framer) load on "Start tour". Dev uses context steps, no fetch.
- Home sends `CardProject` only (no descriptions/tours). Detail page client project has `longDescription: ""`, `tourSteps: []` in prod.
- Images: PNG sources in `assets/projects/<slug>/` (not deployed) → `npm run images` → `public/projects/<slug>/*.webp`. Detail poster uses `<picture>`: thumb (720) on phones, poster (1440) ≥768px.
- OG/Twitter: static `og.png` route handlers (`app/og.png`, `app/projects/[slug]/og.png`) set explicitly in metadata. Don't use `opengraph-image.tsx`: export writes it without an extension (wrong content-type on Pages). next/og needs PNG (reads from assets/) and separate `backgroundColor`/`backgroundImage`.
- Theme: dark default; `light:` Tailwind variant; inline script in layout applies saved theme AND creates the theme-color meta (React-rendered meta duplicated on hydration).
- Perf lessons: no backdrop-blur/mask on sticky header, no SVG feTurbulence grain (use `public/noise.webp`), no backdrop-blur on carousel cards, no will-change on tilt wrappers. Side cards dimmed with a shade layer, not opacity (opacity failed text contrast). White-on-accent buttons use `bg-accent-solid` (#1a5fd8).
- Icon: `app/icon.svg`. Footer + sticky header in `SiteChrome.tsx`.

## Architecture (planned)
- Routes: `/` (hero + filter chips + carousel), `/projects/[slug]` (generateStaticParams), `not-found`, `sitemap.ts`, `opengraph-image` per route (static-generated).
- Shared components, one per pattern: `ProjectCard`, `Carousel` (3D cylinder desktop / swipe stack mobile), `BrowserFrame`, `DemoViewer` (iframe↔video toggle + fallback), `TourOverlay`/`TourBox` (bottom sheet on mobile), `EditToolbar`.
- Shared-element card→detail transition: Framer `layoutId` on card image, kept across routes via a client layout wrapper.
- Repo metadata: `scripts/fetch-repo-meta.ts` runs before `next build` → `content/.generated/repos.json` (gitignored). Uses `GITHUB_TOKEN` if set; on failure keeps last file / omits metadata so the build never fails.
- Edit mode: `process.env.NODE_ENV === 'development'` only. Save via `src/app/api/content/[slug]/route.ts` which **must be excluded from the static export** (dev-only route; guarded + not generated in prod build — see phase 3 notes).
- Iframe is cross-origin: never touch its DOM. Fallback to video on `embeddable:false`, load timeout, or error.

## Repo facts (from READMEs, 2026-11-10)
| slug | repo | runtime | Pages-able |
|---|---|---|---|
| committee-dashboard | Committee-dashboard | single static index.html | yes (main / root); has its own first-visit tour that may appear inside the iframe |
| spruce-triage | SpruceDemoV3 | Streamlit | no → Streamlit Community Cloud |
| reservoir | Reservoir | Streamlit + GeoPandas | no → Streamlit Cloud (heavy) or video only |
| shelfshare | shelfshare | Flask + SQLite, invite-only | no → PythonAnywhere/Fly; private user data, keep video-only |
| loud-agency-crm | PersonalBrandingAgency_Demo | Node server.js + Vite `site/` | only `site/` (marketing), CRM needs Node |

## Open items
- site.json: real name, LinkedIn, email still placeholders.
- Videos: none yet. Posters missing for spruce-triage, reservoir, loud-agency-crm (cards need a generated fallback).
