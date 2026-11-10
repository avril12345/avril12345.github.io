import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** PNG source screenshot (assets/, not deployed) as a data URI; next/og can't read WebP. */
function screenshot(webPath: string | null): string | null {
  if (!webPath) return null;
  const file = path.join(process.cwd(), "assets", webPath.replace(/\.webp$/, ".png"));
  return fs.existsSync(file) ? `data:image/png;base64,${fs.readFileSync(file).toString("base64")}` : null;
}

/** The one Open Graph / Twitter card layout. */
export function renderOg({ eyebrow, title, subtitle, image }: { eyebrow: string; title: string; subtitle: string; image?: string | null }) {
  const shot = screenshot(image ?? null);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#07080b",
          backgroundImage: "radial-gradient(900px 500px at 85% -10%, rgba(61,139,255,0.28), transparent 70%)",
          color: "#ececf1",
          fontFamily: "sans-serif",
          padding: 64,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", width: shot ? 560 : 1000, zIndex: 1 }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#6aa6ff" }}>{eyebrow}</div>
          <div style={{ display: "flex", fontSize: shot ? 60 : 76, fontWeight: 700, lineHeight: 1.05, marginTop: 18, letterSpacing: -1.5 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 28, lineHeight: 1.35, marginTop: 22, color: "#a0a3ae" }}>{subtitle}</div>
        </div>
        {shot && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              right: -40,
              top: 90,
              width: 620,
              height: 420,
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt="" width={672} height={420} style={{ objectFit: "cover", objectPosition: "top" }} />
          </div>
        )}
      </div>
    ),
    OG_SIZE,
  );
}
