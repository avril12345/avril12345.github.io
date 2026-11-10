/** Static /og.png: the home page's Open Graph / Twitter image. */
import { getSite } from "@/lib/content";
import { renderOg } from "@/lib/og";

export const dynamic = "force-static";

export function GET() {
  const site = getSite();
  return renderOg({ eyebrow: "Tools & dashboards", title: site.name, subtitle: site.intro });
}
