import Link from "next/link";
import type { Site } from "@/lib/schema";
import { GitHubIcon, LinkedInIcon, MailIcon } from "./Icons";
import { NavTabs } from "./NavTabs";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({ site }: { site: Site }) {
  return (
    // Solid translucent bar: a backdrop blur + mask here cost ~0.3 s of paint on throttled phones.
    <div className="sticky top-0 z-30 border-b border-line/60 bg-bg/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-medium tracking-tight text-fg transition-colors hover:text-accent-strong">
          {site.name}
        </Link>
        <div className="flex items-center gap-2">
          <NavTabs />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function SiteFooter({ site }: { site: Site }) {
  const { github, linkedin, email } = site.links;
  const icon = "rounded-md p-1.5 text-muted transition-colors hover:text-fg";
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row">
        <p>© {new Date().getFullYear()} {site.name}</p>
        <nav aria-label="Elsewhere" className="flex items-center gap-1">
          <a href={github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={icon}><GitHubIcon /></a>
          {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={icon}><LinkedInIcon /></a>}
          {email && <a href={`mailto:${email}`} aria-label="Email" className={icon}><MailIcon /></a>}
        </nav>
      </div>
    </footer>
  );
}
