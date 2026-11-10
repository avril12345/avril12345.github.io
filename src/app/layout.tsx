import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getSite } from "@/lib/content";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const site = getSite();

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: { default: `${site.name} · Tools & dashboards`, template: `%s · ${site.name}` },
  description: site.intro,
  openGraph: { type: "website", siteName: site.name, title: `${site.name} · Tools & dashboards`, description: site.intro, images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

// No themeColor here: the inline script below creates the theme-color tag itself.
// If React rendered it, the script's change would make React add a duplicate on hydration.
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Applies a saved light-mode choice before first paint (dark is the default),
// and creates the theme-color tag that ThemeToggle updates.
const themeScript = `(function(){var l=false;try{l=localStorage.getItem("theme")==="light"}catch(e){}if(l)document.documentElement.dataset.theme="light";var m=document.createElement("meta");m.name="theme-color";m.content=l?"#f7f8fa":"#07080b";document.head.appendChild(m)})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-dvh flex-col antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-elev focus:px-3 focus:py-2">
          Skip to content
        </a>
        <SiteHeader site={site} />
        <div className="flex-1">{children}</div>
        <SiteFooter site={site} />
      </body>
    </html>
  );
}
