import { LogoLoader } from "@/components/ui/LogoLoader";

/**
 * Next.js Suspense boundary for /studio — shown instantly while the heavy
 * client-side chunks (Three.js, Excalidraw, p5) stream in. The shell (sidebar,
 * topbar) stays painted because it lives in the parent layout.
 */
export default function StudioLoading() {
  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
      <LogoLoader label="Loading Studio" />
    </div>
  );
}
