import type { ReactNode } from "react";
import { Logo } from "~/components/shared/logo";

export function AuthShell({ children }: { children: ReactNode }) {
  return <main id="main-content" tabIndex={-1} className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4 py-12"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_38%)]" /><div className="relative w-full max-w-md"><div className="mb-7 flex justify-center"><Logo href="/" /></div><div className="rounded-xl border border-border bg-surface-raised p-6 shadow-md sm:p-8">{children}</div></div></main>;
}
