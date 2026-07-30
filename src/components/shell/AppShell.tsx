"use client";

import { useWorkspace } from "@/lib/workspace-store";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { ReferralClaim } from "@/components/referral/ReferralClaim";
import { NxLogo } from "@/components/icons";

/**
 * Gates the app shell on store hydration. The server (and the first client
 * render) show a neutral loader — no project data, no Radix triggers — so the
 * client's initial render matches the server exactly. Real content, with the
 * correct persisted project, mounts only after localStorage has loaded. This
 * removes both the "Product 1 → real project" flash and the Radix useId
 * hydration mismatch that came from rendering menus before hydration.
 */
export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const { isHydrated } = useWorkspace();

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <NxLogo className="h-8 w-8 text-primary/40" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Claims a captured ?ref= code once the user is authenticated. */}
      <ReferralClaim />
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <Sidebar userEmail={userEmail} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main id="main-content" className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
