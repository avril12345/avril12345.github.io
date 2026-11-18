import type { ReactNode, Ref } from "react";

type Props = {
  /** Shown under the phone */
  address: string;
  /** Shown under the phone (e.g. "Open live site") */
  actions?: ReactNode;
  /** Absolutely-positioned layer above the content (tour boxes) */
  overlay?: ReactNode;
  /** The phone screen, which tour coordinates are relative to */
  viewportRef?: Ref<HTMLDivElement>;
  children: ReactNode;
};

/** Phone-shaped demo window for mobile-first apps: same props as BrowserFrame. */
export function PhoneFrame({ address, actions, overlay, viewportRef, children }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[400px] overflow-hidden rounded-[40px] border-[12px] border-[#1e293b] bg-[#f8fafc] shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
        <div ref={viewportRef} className="relative aspect-[376/756] w-full">
          {children}
          {overlay}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="font-mono text-xs text-muted">
          <span className="sr-only">Address: </span>
          {address}
        </span>
        {actions}
      </div>
    </div>
  );
}
