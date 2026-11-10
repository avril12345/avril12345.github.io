import type { Metadata } from "next";
import Link from "next/link";
import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/Icons";
import { Markdown } from "@/components/Markdown";
import { ButtonLink } from "@/components/ui";
import { getAbout, getSite } from "@/lib/content";

const about = getAbout();
const site = getSite();

export const metadata: Metadata = {
  title: "About",
  description: about.intro,
  alternates: { canonical: "/about/" },
  openGraph: { title: `About · ${site.name}`, description: about.intro, url: "/about/", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

const initials = site.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function AboutPage() {
  const { github, linkedin, email } = site.links;
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-20 pt-12 md:pt-20">
      <div className="grid gap-12 md:grid-cols-[17rem_1fr] md:gap-16">
        {/* Profile card */}
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
            {about.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={about.photo} alt={site.name} width={160} height={160} className="size-28 rounded-2xl object-cover" />
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
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-fg md:text-5xl">{about.headline}</h1>
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
