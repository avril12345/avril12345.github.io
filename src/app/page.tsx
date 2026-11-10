import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { Starfield } from "@/components/Starfield";
import { getProjects, getSite } from "@/lib/content";

export default function Home() {
  const site = getSite();
  return (
    <main id="main" className="overflow-x-clip">
      <Starfield />
      <div className="relative z-[1]">
      <Hero site={site} />
      <div className="mx-auto max-w-6xl px-4">
        {/* Cards get only what they display; descriptions and tours stay on detail pages. */}
        <Gallery
          projects={getProjects().map(({ slug, title, tagline, tags, status, thumbnail, poster, previewUrl }) => ({ slug, title, tagline, tags, status, thumbnail, poster, previewUrl }))}
        />
      </div>
      </div>
    </main>
  );
}
