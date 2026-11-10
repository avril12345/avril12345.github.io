import type { Metadata } from "next";
import Link from "next/link";
import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/Icons";
import { Markdown } from "@/components/Markdown";
import { ButtonLink } from "@/components/ui";
import { getAbout, getSite } from "@/lib/content";
import type { About } from "@/lib/schema";

// Content is read inside these functions (not at module load) so `npm run dev` picks up
// edits to content/about.json on refresh. The static export reads it once at build time.
export function generateMetadata(): Metadata {
  const about = getAbout();
  const site = getSite();
  return {
    title: "About",
    description: about.intro,
    alternates: { canonical: "/about/" },
    openGraph: { title: `About · ${site.name}`, description: about.intro, url: "/about/", images: [{ url: "/og.png", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: ["/og.png"] },
  };
}

/** Outside work: text + first photo side by side, any further photos as full-width banners. */
function Personal({ personal }: { personal: NonNullable<About["personal"]> }) {
  const [first, ...rest] = personal.photos;
  const Photo = ({ p, className = "" }: { p: (typeof personal.photos)[number]; className?: string }) => (
    <figure className={`overflow-hidden rounded-xl border border-line bg-surface ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.src} alt={p.alt} width={p.width} height={p.height} loading="lazy" decoding="async" className="block h-auto w-full" />
      <figcaption className="px-4 py-2.5 text-xs text-muted">{p.caption}</figcaption>
    </figure>
  );
  return (
    <section aria-labelledby="personal" className="mt-14">
      <h2 id="personal" className="text-sm font-medium uppercase tracking-wider text-muted">{personal.heading}</h2>
      <div className={`mt-4 grid gap-6 ${first ? "md:grid-cols-[1fr_17rem] lg:grid-cols-[1fr_20rem]" : ""}`}>
        <div>
          <Markdown className="text-muted">{personal.body}</Markdown>
          {personal.link && (
            <ButtonLink href={personal.link.url} target="_blank" rel="noopener noreferrer" className="mt-6">
              <CameraIcon /> {personal.link.label} <span aria-hidden>{"↗︎"}</span>
            </ButtonLink>
          )}
        </div>
        {first && <Photo p={first} className="self-start" />}
      </div>
      {rest.map((p) => <Photo key={p.src} p={p} className="mt-6" />)}
      {personal.embed && (
        <div className="mt-10">
          <h3 className="text-sm font-medium text-fg">{personal.embed.heading}</h3>
          {/* Lazy: the slideshow only loads when scrolled near, so it doesn't slow the page. */}
          <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
            <iframe
              src={personal.embed.url}
              title={personal.embed.title}
              loading="lazy"
              allow="fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="size-full border-0"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

export default function AboutPage() {
  const about = getAbout();
  const site = getSite();
  const initials = site.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const { github, linkedin, email } = site.links;
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-20 pt-12 md:pt-20">
      <div className="grid gap-12 md:grid-cols-[17rem_1fr] md:gap-16">
        {/* Profile card */}
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
            {about.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={about.photo} alt={site.name} width={320} height={320} className="size-32 rounded-2xl object-cover" />
            ) : (
              <div aria-hidden className="grid size-28 place-items-center rounded-2xl bg-gradient-to-br from-accent-solid to-accent-strong text-3xl font-semibold tracking-tight text-white">
                {initials}
              </div>
            )}
            <p className="mt-5 text-lg font-semibold tracking-tight text-fg">{site.name}</p>
            <p className="mt-1 text-sm text-muted">Tools &amp; dashboards</p>
            <nav aria-label="Contact" className="mt-5 flex flex-col gap-2">
              <ButtonLink href={github} target="_blank" rel="noopener noreferrer"><GitHubIcon /> GitHub</ButtonLink>
              {linkedin && <ButtonLink href={linkedin} target="_blank" rel="noopener noreferrer"><LinkedInIcon /> LinkedIn</ButtonLink>}
              {email && <ButtonLink href={`mailto:${email}`}><MailIcon /> Email</ButtonLink>}
              {about.resumeUrl && <ButtonLink href={about.resumeUrl} target="_blank" rel="noopener noreferrer" variant="primary">Download CV</ButtonLink>}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">{about.eyebrow}</p>
          {/* Long headlines (a sentence or two) get a calmer size so they don't swamp the page. */}
          <h1 className={`mt-4 text-balance font-semibold tracking-tight text-fg ${about.headline.length > 90 ? "text-2xl leading-snug md:text-[2rem]" : "text-3xl md:text-5xl"}`}>{about.headline}</h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted">{about.intro}</p>

          <Markdown className="mt-8 max-w-2xl text-muted">{about.body}</Markdown>

          {about.focus.length > 0 && (
            <section aria-labelledby="focus" className="mt-14">
              <h2 id="focus" className="text-sm font-medium uppercase tracking-wider text-muted">What I build</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {about.focus.map((f) => (
                  <li key={f.title} className="rounded-xl border border-line bg-surface p-5">
                    <p className="font-medium text-fg">{f.title}</p>
                    <p className="mt-2 text-sm text-muted">{f.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {about.skills.length > 0 && (
            <section aria-labelledby="skills" className="mt-14">
              <h2 id="skills" className="text-sm font-medium uppercase tracking-wider text-muted">Toolkit</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {about.skills.map((s) => (
                  <div key={s.group}>
                    <dt className="text-sm text-fg">{s.group}</dt>
                    <dd className="mt-2 flex flex-wrap gap-1.5">
                      {s.items.map((i) => (
                        <span key={i} className="rounded-md border border-line bg-surface px-2 py-0.5 text-xs text-muted">{i}</span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {about.personal && <Personal personal={about.personal} />}

          <section className="mt-16 rounded-2xl border border-line bg-accent-soft p-6 md:p-8">
            <p className="text-lg text-fg">{about.cta}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {email && <ButtonLink href={`mailto:${email}`} variant="primary"><MailIcon /> Get in touch</ButtonLink>}
              <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface-strong">
                See my work →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
