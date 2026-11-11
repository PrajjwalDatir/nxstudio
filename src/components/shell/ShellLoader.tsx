import { NxLogo } from "@/components/icons";
import { ReworkBanner } from "@/components/shell/ReworkBanner";

/**
 * Neutral loading frame shown both as the Suspense fallback while the
 * workspace data streams in, and by AppShell before client hydration. Must
 * stay visually identical in both spots so the swap-in is invisible.
 */
export function ShellLoader() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <ReworkBanner />
      <div className="flex flex-1 items-center justify-center">
        <NxLogo className="h-8 w-8 text-primary/40" />
      </div>
    </div>
  );
}
