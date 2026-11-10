import type { Site } from "@/lib/schema";
import { GitHubIcon, LinkedInIcon, MailIcon } from "./Icons";
import { ButtonLink } from "./ui";

export function Hero({ site }: { site: Site }) {
  const { github, linkedin, email } = site.links;
  return (
    <header className="mx-auto max-w-3xl px-4 pb-12 pt-12 text-center md:pb-16 md:pt-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">Tools &amp; dashboards</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-fg md:text-6xl">{site.name}</h1>
      <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted">{site.intro}</p>
      <nav aria-label="Contact" className="mt-8 flex flex-wrap justify-center gap-2">
        <ButtonLink href={github} target="_blank" rel="noopener noreferrer"><GitHubIcon /> GitHub</ButtonLink>
        {linkedin && <ButtonLink href={linkedin} target="_blank" rel="noopener noreferrer"><LinkedInIcon /> LinkedIn</ButtonLink>}
        {email && <ButtonLink href={`mailto:${email}`}><MailIcon /> Email</ButtonLink>}
      </nav>
    </header>
  );
}
