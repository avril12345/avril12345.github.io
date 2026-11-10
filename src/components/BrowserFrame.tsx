import type { ReactNode, Ref } from "react";

type Props = {
  /** Shown in the URL bar */
  address: string;
  /** Right side of the toolbar */
  actions?: ReactNode;
  /** Absolutely-positioned layer above the content (tour boxes) */
  overlay?: ReactNode;
  /** The 16:10 viewport, which tour coordinates are relative to */
  viewportRef?: Ref<HTMLDivElement>;
  children: ReactNode;
};

/** The one browser-window chrome: traffic lights, URL bar, 16:10 viewport. */
export function BrowserFrame({ address, actions, overlay, viewportRef, children }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-elev shadow-soft">
      <div className="flex items-center gap-3 border-b border-line px-3 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="size-2.5 rounded-full bg-[#ff5f57]" />
          <i className="size-2.5 rounded-full bg-[#febc2e]" />
          <i className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <div className="min-w-0 flex-1 truncate rounded-md border border-line bg-surface px-3 py-1 text-center font-mono text-xs text-muted">
          <span className="sr-only">Address: </span>
          {address}
        </div>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>
      <div ref={viewportRef} className="relative aspect-[16/10] w-full">
        {children}
        {overlay}
      </div>
    </div>
  );
}
