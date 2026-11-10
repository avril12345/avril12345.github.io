import type { MetadataRoute } from "next";
import { getProjects, getRepoMeta, getSite } from "@/lib/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const { siteUrl } = getSite();
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    ...getProjects().map((p) => ({
      url: `${siteUrl}/projects/${p.slug}/`,
      lastModified: getRepoMeta(p.repo)?.pushedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
