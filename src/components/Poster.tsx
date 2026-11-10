import Image from "next/image";
import type { CSSProperties, Ref } from "react";
import type { Project } from "@/lib/schema";

type Props = {
  project: Pick<Project, "title" | "tagline" | "poster" | "thumbnail" | "tags">;
  /** "thumb" for cards, "poster" for the demo frame */
  variant: "thumb" | "poster";
  priority?: boolean;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
};

/**
 * The one image component for project visuals: the screenshot when there is one,
 * otherwise a generated title card.
 */
export function Poster({ project, variant, priority, sizes, className = "", style, ref }: Props) {
  const src = variant === "thumb" ? project.thumbnail ?? project.poster : project.poster ?? project.thumbnail;
  return (
    <div
      ref={ref}
      style={style}
      className={`relative overflow-hidden bg-elev ${className}`}
    >
      {variant === "poster" && project.poster && project.thumbnail ? (
        <picture>
          <source media="(min-width: 768px)" srcSet={project.poster} />
          <img
            src={project.thumbnail}
            alt=""
            fetchPriority={priority ? "high" : undefined}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 size-full object-cover object-top"
          />
        </picture>
      ) : src ? (
        <Image
          src={src}
          alt=""
          fill
          priority={priority}
          sizes={sizes ?? (variant === "thumb" ? "380px" : "(min-width: 1024px) 1100px, 100vw")}
          className="object-cover object-top"
        />
      ) : (
        <TitleCard title={project.title} tagline={project.tagline} tag={project.tags[0]} large={variant === "poster"} />
      )}
    </div>
  );
}

function TitleCard({ title, tagline, tag, large }: { title: string; tagline: string; tag: string; large: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-[radial-gradient(120%_90%_at_100%_0%,var(--accent-soft),transparent_60%),linear-gradient(160deg,var(--bg-elev),var(--bg))] p-[6%]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
      />
      <span className={`relative font-mono uppercase tracking-widest text-accent-strong ${large ? "text-xs" : "text-[10px]"}`}>{tag}</span>
      <span className={`relative mt-2 font-semibold tracking-tight text-fg ${large ? "text-4xl md:text-5xl" : "text-2xl"}`}>{title}</span>
      {large && <span className="relative mt-3 max-w-xl text-muted">{tagline}</span>}
    </div>
  );
}
