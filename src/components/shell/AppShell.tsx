"use client";

import { useWorkspace } from "@/lib/workspace-store";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
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
      <Sidebar userEmail={userEmail} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
