import { NxLogo } from "@/components/icons";

/**
 * Neutral loading frame shown both as the Suspense fallback while the
 * workspace data streams in, and by AppShell before client hydration. Must
 * stay visually identical in both spots so the swap-in is invisible.
 */
export function ShellLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <NxLogo className="h-8 w-8 text-primary/40" />
    </div>
  );
}
