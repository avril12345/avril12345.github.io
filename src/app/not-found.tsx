import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-[70dvh] place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-sm text-accent-strong">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg">This page doesn&apos;t exist</h1>
        <p className="mt-3 text-muted">The link may be old, or the project may have moved.</p>
        <Link href="/" className="mt-8 inline-flex rounded-lg border border-line bg-surface px-4 py-2 text-sm text-fg transition-colors hover:border-line-strong">
          Back to all projects
        </Link>
      </div>
    </main>
  );
}
