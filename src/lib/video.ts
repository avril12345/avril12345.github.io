export type VideoSource =
  | { kind: "file"; src: string }
  | { kind: "youtube"; id: string; src: string }
  | { kind: "loom"; id: string; src: string };

/** Classifies a videoUrl as a self-hosted file or a YouTube/Loom embed. */
export function parseVideo(url: string | null): VideoSource | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", id: yt[1], src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1` };
  const loom = url.match(/loom\.com\/(?:share|embed)\/([\da-f]+)/i);
  if (loom) return { kind: "loom", id: loom[1], src: `https://www.loom.com/embed/${loom[1]}?hide_owner=true&hide_share=true` };
  return { kind: "file", src: url };
}

/** Embed URL that starts at `seconds` (used by tour steps with videoTimestamp). */
export function embedAt(v: VideoSource, seconds: number, autoplay = true) {
  const t = Math.floor(seconds);
  if (v.kind === "youtube") return `${v.src}&start=${t}${autoplay ? "&autoplay=1&mute=1" : ""}`;
  if (v.kind === "loom") return `${v.src}&t=${t}${autoplay ? "&autoplay=1" : ""}`;
  return v.src;
}
