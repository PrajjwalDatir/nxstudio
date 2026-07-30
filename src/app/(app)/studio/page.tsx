"use client";

import dynamic from "next/dynamic";
import { LogoLoader } from "@/components/ui/LogoLoader";

/**
 * Studio — one shared creative canvas. Heavy client-side deps (Three.js,
 * Excalidraw, p5) are code-split and loaded only on the client. The App Shell
 * (sidebar, topbar) renders instantly from the parent layout, and the Next.js
 * `loading.tsx` boundary shows the branded logo skeleton while the JS payload
 * streams in.
 */
const UnifiedStudio = dynamic(
  () => import("@/components/studio/UnifiedStudio").then((m) => m.UnifiedStudio),
  {
    ssr: false,
    loading: () => <LogoLoader label="Loading Studio" />,
  }
);

export default function StudioPage() {
  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
      <UnifiedStudio />
    </div>
  );
}
