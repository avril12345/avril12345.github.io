import { z } from "zod";

/** One guided-tour callout. Coordinates are percentages of the demo frame's viewport. */
export const TourStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Markdown */
  body: z.string(),
  /** Hotspot target, 0–100 % of the frame width */
  x: z.number().min(0).max(100),
  /** Hotspot target, 0–100 % of the frame height */
  y: z.number().min(0).max(100),
  /** Callout width in px (desktop) */
  width: z.number().int().min(160).max(520).default(280),
  /** Which side of the hotspot the callout sits on */
  anchor: z.enum(["top", "right", "bottom", "left"]).default("right"),
  /** Seconds into the walkthrough video; the video seeks here when the step opens */
  videoTimestamp: z.number().min(0).optional(),
  /** Drafts are visible only in edit mode */
  draft: z.boolean().default(true),
});

export const ProjectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  /** Position in the gallery (ascending) */
  order: z.number().int(),
  title: z.string().min(1),
  tagline: z.string().min(1),
  /** One or two sentences for cards and meta descriptions */
  description: z.string().min(1),
  /** Markdown */
  longDescription: z.string(),
  tags: z.array(z.string()).min(1),
  year: z.number().int(),
  status: z.enum(["live", "beta", "archived"]),
  /** "owner/name" on GitHub; used for build-time metadata */
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  repoUrl: z.url(),
  liveUrl: z.url().nullable(),
  /** Iframe address when it differs from liveUrl (e.g. a Streamlit app's ?embed=true) */
  embedUrl: z.url().nullable().default(null),
  /** True only when the site can be shown in an iframe */
  embeddable: z.boolean(),
  /** MP4/WebM path under /public, or a YouTube/Loom URL */
  videoUrl: z.string().nullable(),
  /** Optional short muted loop (MP4/WebM, ~5–10 s, ~1–2 MB) for the gallery card */
  previewUrl: z.string().nullable().default(null),
  /** Paths under /public */
  poster: z.string().nullable(),
  thumbnail: z.string().nullable(),
  tourSteps: z.array(TourStepSchema),
});

export const SiteSchema = z.object({
  name: z.string(),
  intro: z.string(),
  siteUrl: z.url(),
  links: z.object({
    github: z.url(),
    linkedin: z.url().nullable(),
    email: z.email().nullable(),
  }),
});

/** content/about.json: the About page. `body` is markdown. */
export const AboutSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  intro: z.string(),
  photo: z.string().nullable().default(null),
  resumeUrl: z.string().nullable().default(null),
  body: z.string(),
  focus: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
  skills: z.array(z.object({ group: z.string(), items: z.array(z.string()) })).default([]),
  cta: z.string(),
  /** "Outside work": markdown text, photos (local paths with pixel size), optional link. */
  personal: z
    .object({
      heading: z.string(),
      body: z.string(),
      photos: z.array(z.object({ src: z.string(), alt: z.string(), caption: z.string(), width: z.number(), height: z.number() })).default([]),
      link: z.object({ label: z.string(), url: z.url() }).nullable().default(null),
      /** Optional embedded viewer (e.g. a Canva design's `/view?embed` URL), shown in a 16:9 window. */
      embed: z.object({ heading: z.string(), title: z.string(), url: z.url() }).nullable().default(null),
    })
    .nullable()
    .default(null),
});
export type About = z.infer<typeof AboutSchema>;

export type TourStep = z.infer<typeof TourStepSchema>;
/** A step as sent to visitors: body pre-rendered to HTML at build time. */
export type TourStepView = TourStep & { html?: string };
/** Only what a gallery card needs, so the home page doesn't carry descriptions or tours. */
export type CardProject = Pick<Project, "slug" | "title" | "tagline" | "tags" | "status" | "thumbnail" | "poster" | "previewUrl">;
export type Project = z.infer<typeof ProjectSchema>;
export type Site = z.infer<typeof SiteSchema>;
