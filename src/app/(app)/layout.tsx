import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchProjects, fetchCollections } from "@/lib/projects-server";
import { WorkspaceProvider } from "@/lib/workspace-store";
import { CommandProvider } from "@/components/shell/CommandPalette";
import { SidebarProvider } from "@/components/shell/sidebar-context";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: the middleware already gates this route, but we re-verify
  // server-side so a Server Component never renders for an unauthenticated user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load the user's projects + collections on the server so the shell renders
  // with real data on first paint.
  const [initialProjects, initialCollections] = await Promise.all([
    fetchProjects(),
    fetchCollections(),
  ]);

  return (
    <WorkspaceProvider
      initialProjects={initialProjects}
      initialCollections={initialCollections}
      userId={user.id}
    >
      <CommandProvider>
        <SidebarProvider>
          <AppShell userEmail={user.email ?? ""} isAnonymous={user.is_anonymous ?? false}>{children}</AppShell>
        </SidebarProvider>
      </CommandProvider>
    </WorkspaceProvider>
  );
}
