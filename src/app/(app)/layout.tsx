import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchProjects } from "@/lib/projects-server";
import { WorkspaceProvider } from "@/lib/workspace-store";
import { SyncProvider } from "@/lib/sync-store";
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

  // Load the user's projects on the server so the shell renders with real data.
  const initialProjects = await fetchProjects();

  return (
    <WorkspaceProvider initialProjects={initialProjects} userId={user.id}>
      <SyncProvider>
        <CommandProvider>
          <SidebarProvider>
            <AppShell userEmail={user.email ?? ""}>{children}</AppShell>
          </SidebarProvider>
        </CommandProvider>
      </SyncProvider>
    </WorkspaceProvider>
  );
}
